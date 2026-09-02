import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createServer } from "node:http";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createApp } from "../../panel/server.js";
import { createUser, setPassword, listUsers } from "../../panel/users.js";

// Роут /users проверяется как обычный HTTP-эндпоинт (fetch к настоящему
// серверу), а не браузерным e2e (Playwright) из черновика плана: страница
// не завязана на GitHub и не рисует ничего, что нельзя проверить по HTML —
// заводить браузер ради этого незачем.

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
  dir = mkdtempSync(path.join(tmpdir(), "panel-users-route-"));
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
  return res.headers.get("set-cookie").split(";")[0];
}

function postForm(cookie, fields) {
  return fetch(`${baseUrl}/admin/_panel/users`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie },
    body: new URLSearchParams(fields),
    redirect: "manual",
  });
}

describe("/admin/_panel/users (только владелец)", () => {
  it("без сессии — на вход с возвратом", async () => {
    const res = await fetch(`${baseUrl}/admin/_panel/users`, { redirect: "manual" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "/admin/_panel/auth?redirect=%2Fadmin%2F_panel%2Fusers",
    );
  });

  it("редактора не пускает — редирект в панель", async () => {
    const { tempPassword } = await createUser(usersPath, { email: "ed@example.ru", role: "editor" });
    await setPassword(usersPath, "ed@example.ru", "нормальныйпароль1");
    const cookie = await loginAndGetCookie("ed@example.ru", "нормальныйпароль1");

    const res = await fetch(`${baseUrl}/admin/_panel/users`, { headers: { cookie }, redirect: "manual" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin/");
  });

  it("владелец заводит редактора и видит временный пароль на странице", async () => {
    await createUser(usersPath, { email: "owner@example.ru", role: "owner" });
    await setPassword(usersPath, "owner@example.ru", "нормальныйпароль1");
    const cookie = await loginAndGetCookie("owner@example.ru", "нормальныйпароль1");

    const res = await postForm(cookie, { action: "create", email: "new-ed@example.ru", role: "editor" });
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain("new-ed@example.ru");
    expect(html).toMatch(/Временный пароль: \S{12}/);
    expect(listUsers(usersPath)).toHaveLength(2);
  });

  it("не даёт удалить последнего владельца", async () => {
    await createUser(usersPath, { email: "owner@example.ru", role: "owner" });
    await setPassword(usersPath, "owner@example.ru", "нормальныйпароль1");
    const cookie = await loginAndGetCookie("owner@example.ru", "нормальныйпароль1");

    const res = await postForm(cookie, { action: "delete", email: "owner@example.ru" });
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("последнего владельца");
    expect(listUsers(usersPath)).toHaveLength(1);
  });

  it("удаляет обычного пользователя и возвращается к списку", async () => {
    await createUser(usersPath, { email: "owner@example.ru", role: "owner" });
    await setPassword(usersPath, "owner@example.ru", "нормальныйпароль1");
    await createUser(usersPath, { email: "ed@example.ru", role: "editor" });
    const cookie = await loginAndGetCookie("owner@example.ru", "нормальныйпароль1");

    const res = await postForm(cookie, { action: "delete", email: "ed@example.ru" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin/_panel/users");
    expect(listUsers(usersPath)).toHaveLength(1);
  });
});
