import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createServer } from "node:http";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createApp } from "../../panel/server.js";
import { createUser, setPassword } from "../../panel/users.js";

// /admin/_panel/ (start.js) сама заходит в GitHub за «последними изменениями» —
// стабим fetch, чтобы тест не бил по-настоящему в api.github.com фейковым
// токеном (там и так есть отдельное graceful-падение, тестируемое в start.test.js).
function stubGithub() {
  const realFetch = globalThis.fetch;
  vi.stubGlobal(
    "fetch",
    vi.fn((url, init) => {
      const u = String(url);
      if (!u.startsWith("https://api.github.com")) return realFetch(url, init);
      return Promise.resolve(new Response("[]"));
    }),
  );
}

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
  dir = mkdtempSync(path.join(tmpdir(), "panel-logout-"));
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

describe("/admin/_panel/logout", () => {
  it("GET не поддерживается (выход — только через форму, не по ссылке)", async () => {
    const res = await fetch(`${baseUrl}/admin/_panel/logout`);
    expect(res.status).toBe(405);
  });

  it("POST очищает сессию и после этого /admin/_panel/ снова требует входа", async () => {
    await createUser(usersPath, { email: "a@example.ru", role: "owner" });
    await setPassword(usersPath, "a@example.ru", "нормальныйпароль1");
    const cookie = await loginAndGetCookie("a@example.ru", "нормальныйпароль1");

    stubGithub();
    const before = await fetch(`${baseUrl}/admin/_panel/`, { headers: { cookie } });
    expect(before.status).toBe(200);

    const logoutRes = await fetch(`${baseUrl}/admin/_panel/logout`, {
      method: "POST",
      headers: { cookie },
      redirect: "manual",
    });
    expect(logoutRes.status).toBe(302);
    expect(logoutRes.headers.get("location")).toBe("/admin/_panel/auth");
    const clearedCookie = logoutRes.headers.get("set-cookie").split(";")[0];

    const after = await fetch(`${baseUrl}/admin/_panel/`, {
      headers: { cookie: clearedCookie },
      redirect: "manual",
    });
    expect(after.status).toBe(302);
    expect(after.headers.get("location")).toContain("/admin/_panel/auth");
    vi.unstubAllGlobals();
  });
});
