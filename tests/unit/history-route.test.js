import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { createServer } from "node:http";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createApp } from "../../panel/server.js";
import { createUser, setPassword } from "../../panel/users.js";

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

function jsonResponse(body) {
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), "panel-history-route-"));
  usersPath = path.join(dir, "users.json");
  process.env.PANEL_USERS_PATH = usersPath;
  writeFileSync(usersPath, "[]\n", "utf8");

  server = createServer(createApp(CONFIG));
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  rmSync(dir, { recursive: true, force: true });
  delete process.env.PANEL_USERS_PATH;
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

describe("страница «История» (роут)", () => {
  it("без сессии редиректит на вход с возвратом", async () => {
    const res = await fetch(`${baseUrl}/admin/_panel/history`, { redirect: "manual" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "/admin/_panel/auth?redirect=%2Fadmin%2F_panel%2Fhistory",
    );
  });

  it("с сессией показывает список версий (редактору тоже доступно)", async () => {
    const { tempPassword } = await createUser(usersPath, { email: "editor@example.ru", role: "editor" });
    await setPassword(usersPath, "editor@example.ru", "нормальныйпароль1");
    const cookie = await loginAndGetCookie("editor@example.ru", "нормальныйпароль1");

    // Стабим fetch только для запросов к api.github.com — запросы к нашему
    // же тестовому серверу (baseUrl) должны идти по-настоящему, иначе мы
    // перехватим собственный HTTP-клиент теста вместо GitHub API.
    const realFetch = globalThis.fetch;
    vi.stubGlobal(
      "fetch",
      vi.fn((url, init) => {
        const u = String(url);
        if (!u.startsWith("https://api.github.com")) return realFetch(url, init);
        if (u.includes("path=src%2F_data")) {
          return jsonResponse([{ sha: "c1", commit: { message: "feat: заголовок", author: { name: "Лена", date: "2026-01-01T00:00:00Z" } } }]);
        }
        return jsonResponse([]);
      }),
    );

    const res = await fetch(`${baseUrl}/admin/_panel/history`, { headers: { cookie } });
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain("feat: заголовок");
    expect(html).toContain("Вернуть эту версию");

    vi.unstubAllGlobals();
  });
});
