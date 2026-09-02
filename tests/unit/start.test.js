import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
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

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), "panel-start-"));
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

function stubGithub() {
  const realFetch = globalThis.fetch;
  vi.stubGlobal(
    "fetch",
    vi.fn((url, init) => {
      const u = String(url);
      if (!u.startsWith("https://api.github.com")) return realFetch(url, init);
      if (u.includes("path=src%2F_data")) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              { sha: "c1", commit: { message: "feat: заголовок", author: { name: "Лена", date: "2026-01-01T00:00:00Z" } } },
            ]),
          ),
        );
      }
      return Promise.resolve(new Response("[]"));
    }),
  );
}

describe("/admin/_panel/ («С чего начать»)", () => {
  it("без сессии на / и /admin/_panel — редирект на вход", async () => {
    const res1 = await fetch(`${baseUrl}/admin/_panel/`, { redirect: "manual" });
    expect(res1.status).toBe(302);
    expect(res1.headers.get("location")).toBe(
      "/admin/_panel/auth?redirect=%2Fadmin%2F_panel%2F",
    );

    const res2 = await fetch(`${baseUrl}/admin/_panel`, { redirect: "manual" });
    expect(res2.status).toBe(302);
  });

  it("владельцу показывает карточку «Пользователи» и последние изменения", async () => {
    await createUser(usersPath, { email: "owner@example.ru", role: "owner" });
    await setPassword(usersPath, "owner@example.ru", "нормальныйпароль1");
    const cookie = await loginAndGetCookie("owner@example.ru", "нормальныйпароль1");

    stubGithub();
    const res = await fetch(`${baseUrl}/admin/_panel/`, { headers: { cookie } });
    const html = await res.text();
    vi.unstubAllGlobals();

    expect(res.status).toBe(200);
    expect(html).toContain("owner@example.ru");
    expect(html).toContain("Пользователи");
    expect(html).toContain("feat: заголовок");
    expect(html).toContain(CONFIG.supportUrl);
  });

  it("редактору не показывает карточку «Пользователи»", async () => {
    await createUser(usersPath, { email: "ed@example.ru", role: "editor" });
    await setPassword(usersPath, "ed@example.ru", "нормальныйпароль1");
    const cookie = await loginAndGetCookie("ed@example.ru", "нормальныйпароль1");

    stubGithub();
    const res = await fetch(`${baseUrl}/admin/_panel/`, { headers: { cookie } });
    const html = await res.text();
    vi.unstubAllGlobals();

    expect(html).not.toContain("Добавить редактора");
  });

  it("после входа с ?redirect=/admin/_panel/ возвращает сюда, а не в CMS-хендшейк", async () => {
    await createUser(usersPath, { email: "owner2@example.ru", role: "owner" });
    await setPassword(usersPath, "owner2@example.ru", "нормальныйпароль1");

    const res = await fetch(
      `${baseUrl}/admin/_panel/auth?redirect=${encodeURIComponent("/admin/_panel/")}`,
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email: "owner2@example.ru", password: "нормальныйпароль1" }),
        redirect: "manual",
      },
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin/_panel/");
  });
});
