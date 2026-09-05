import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createServer } from "node:http";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createApp } from "../../panel/server.js";
import { createUser, setPassword } from "../../panel/users.js";

const CONFIG = {
  repo: "owner/test-repo",
  botToken: "test-bot-token-xyz",
  sessionSecret: "x".repeat(32),
  supportUrl: "https://t.me/vireflow_support",
};

let dir;
let usersPath;
let server;
let baseUrl;

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), "panel-auth-"));
  usersPath = path.join(dir, "users.json");
  process.env.PANEL_USERS_PATH = usersPath;

  server = createServer(createApp(CONFIG));
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  rmSync(dir, { recursive: true, force: true });
  delete process.env.PANEL_USERS_PATH;
});

beforeEach(() => {
  writeFileSync(usersPath, "[]\n", "utf8");
});

function postForm(url, fields) {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields),
    redirect: "manual",
  });
}

describe("вход по email/паролю (маскировка GitHub)", () => {
  it("GET отдаёт нашу форму входа, а не GitHub", async () => {
    const res = await fetch(`${baseUrl}/admin/_panel/auth?provider=github&scope=repo`);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain("Вход в панель управления");
    expect(html.toLowerCase()).not.toContain("github.com");
  });

  it("неверный пароль → форма с ошибкой, без токена", async () => {
    await createUser(usersPath, { email: "owner@example.ru", role: "owner" });
    await setPassword(usersPath, "owner@example.ru", "верныйпароль123");

    const res = await postForm(`${baseUrl}/admin/_panel/auth?provider=github`, {
      email: "owner@example.ru",
      password: "неверный",
    });
    const html = await res.text();

    expect(res.status).toBe(401);
    expect(html).toContain("Неверная почта или пароль");
    expect(html).not.toContain("test-bot-token-xyz");
  });

  it("несуществующая почта отвечает так же, как неверный пароль", async () => {
    const res = await postForm(`${baseUrl}/admin/_panel/auth?provider=github`, {
      email: "нет-такого@example.ru",
      password: "что-угодно",
    });
    expect(res.status).toBe(401);
    expect(await res.text()).toContain("Неверная почта или пароль");
  });

  it("верный пароль → страница с postMessage и токеном бота, GitHub не виден", async () => {
    await createUser(usersPath, { email: "owner@example.ru", role: "owner" });
    await setPassword(usersPath, "owner@example.ru", "верныйпароль123");

    const res = await postForm(`${baseUrl}/admin/_panel/auth?provider=github`, {
      email: "owner@example.ru",
      password: "верныйпароль123",
    });
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain("authorization:github:success:");
    expect(html).toContain("test-bot-token-xyz");
    expect(html).toContain("window.opener.postMessage");
    expect(html.toLowerCase()).not.toContain("github.com/login");
    // Сессионная кука для наших страниц (/account, /users, /history) выставлена:
    expect(res.headers.get("set-cookie")).toContain("panel_session=");
  });

  it("mustChangePassword=true после входа ведёт на смену пароля, а не в CMS", async () => {
    // createUser сам ставит временный пароль и mustChangePassword: true.
    const { tempPassword } = await createUser(usersPath, { email: "new@example.ru", role: "editor" });

    const res = await postForm(`${baseUrl}/admin/_panel/auth?provider=github`, {
      email: "new@example.ru",
      password: tempPassword,
    });

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin/_panel/account");
  });

  it("после входа со ?redirect= на известную страницу — уходит туда, а не в хендшейк CMS", async () => {
    await createUser(usersPath, { email: "owner@example.ru", role: "owner" });
    await setPassword(usersPath, "owner@example.ru", "верныйпароль123");

    const res = await postForm(
      `${baseUrl}/admin/_panel/auth?redirect=${encodeURIComponent("/admin/_panel/account")}`,
      { email: "owner@example.ru", password: "верныйпароль123" },
    );

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin/_panel/account");
  });

  it("игнорирует посторонний ?redirect= (не открытый редирект)", async () => {
    await createUser(usersPath, { email: "owner@example.ru", role: "owner" });
    await setPassword(usersPath, "owner@example.ru", "верныйпароль123");

    const res = await postForm(
      `${baseUrl}/admin/_panel/auth?provider=github&redirect=${encodeURIComponent("https://evil.example/")}`,
      { email: "owner@example.ru", password: "верныйпароль123" },
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toContain("authorization:github:success:");
  });
});
