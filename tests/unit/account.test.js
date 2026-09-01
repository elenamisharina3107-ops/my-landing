import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createServer } from "node:http";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createApp } from "../../panel/server.js";
import { createUser, findUserByEmail } from "../../panel/users.js";
import { verifyPassword } from "../../panel/password.js";

const CONFIG = {
  repo: "owner/test-repo",
  botToken: "test-bot-token",
  sessionSecret: "x".repeat(32),
  supportUrl: "https://t.me/vireflow_support",
};

let dir;
let usersPath;
let server;
let baseUrl;

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), "panel-account-"));
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

async function loginAndGetCookie(email, password) {
  const res = await fetch(`${baseUrl}/admin/_panel/auth`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email, password }),
    redirect: "manual",
  });
  const setCookie = res.headers.get("set-cookie");
  return setCookie.split(";")[0]; // "panel_session=..."
}

describe("смена собственного пароля", () => {
  it("без сессии отправляет на вход с возвратом на /account", async () => {
    const res = await fetch(`${baseUrl}/admin/_panel/account`, { redirect: "manual" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "/admin/_panel/auth?redirect=%2Fadmin%2F_panel%2Faccount",
    );
  });

  it("слишком короткий пароль отклоняется", async () => {
    const { tempPassword } = await createUser(usersPath, { email: "a@example.ru", role: "editor" });
    const cookie = await loginAndGetCookie("a@example.ru", tempPassword);

    const res = await fetch(`${baseUrl}/admin/_panel/account`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", cookie },
      body: new URLSearchParams({ password: "корот", confirm: "корот" }),
    });

    expect(res.status).toBe(400);
    expect(await res.text()).toContain("не короче 8 символов");
  });

  it("несовпадающие пароли отклоняются", async () => {
    const { tempPassword } = await createUser(usersPath, { email: "a@example.ru", role: "editor" });
    const cookie = await loginAndGetCookie("a@example.ru", tempPassword);

    const res = await fetch(`${baseUrl}/admin/_panel/account`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", cookie },
      body: new URLSearchParams({ password: "нормальныйпароль1", confirm: "другой-пароль" }),
    });

    expect(res.status).toBe(400);
    expect(await res.text()).toContain("не совпадают");
  });

  it("верный ввод меняет пароль и снимает mustChangePassword", async () => {
    const { tempPassword } = await createUser(usersPath, { email: "a@example.ru", role: "editor" });
    const cookie = await loginAndGetCookie("a@example.ru", tempPassword);

    const res = await fetch(`${baseUrl}/admin/_panel/account`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", cookie },
      body: new URLSearchParams({ password: "новыйпароль123", confirm: "новыйпароль123" }),
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Пароль сохранён");

    const user = findUserByEmail(usersPath, "a@example.ru");
    expect(user.mustChangePassword).toBe(false);
    await expect(verifyPassword("новыйпароль123", user.passwordHash)).resolves.toBe(true);

    // И теперь вход этим паролем уже не требует смены — уходит в хендшейк CMS:
    const secondLogin = await fetch(`${baseUrl}/admin/_panel/auth?provider=github`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ email: "a@example.ru", password: "новыйпароль123" }),
    });
    expect(await secondLogin.text()).toContain("authorization:github:success:");
  });
});
