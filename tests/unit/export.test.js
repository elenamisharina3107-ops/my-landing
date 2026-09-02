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
  dir = mkdtempSync(path.join(tmpdir(), "panel-export-"));
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

describe("/admin/_panel/export", () => {
  it("без сессии редиректит на вход", async () => {
    const res = await fetch(`${baseUrl}/admin/_panel/export`, { redirect: "manual" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "/admin/_panel/auth?redirect=%2Fadmin%2F_panel%2Fexport",
    );
  });

  it("с сессией отдаёт архив с нужными заголовками", async () => {
    const { tempPassword } = await createUser(usersPath, { email: "a@example.ru", role: "owner" });
    await setPassword(usersPath, "a@example.ru", "нормальныйпароль1");
    const cookie = await loginAndGetCookie("a@example.ru", "нормальныйпароль1");

    const realFetch = globalThis.fetch;
    vi.stubGlobal(
      "fetch",
      vi.fn((url, init) => {
        const u = String(url);
        if (!u.startsWith("https://api.github.com")) return realFetch(url, init);
        return Promise.resolve(new Response("PK-fake-zip-content"));
      }),
    );

    const res = await fetch(`${baseUrl}/admin/_panel/export`, { headers: { cookie } });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/zip");
    expect(res.headers.get("content-disposition")).toContain("attachment; filename=");
    expect(await res.text()).toBe("PK-fake-zip-content");

    vi.unstubAllGlobals();
  });
});
