import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer } from "node:http";
import { createApp } from "../../panel/server.js";

// .js, не .ts из черновика плана: реализация панели на чистом JS без
// сборки, поэтому TypeScript-тулчейн тестам не нужен.

const TEST_CONFIG = {
  repo: "owner/test-repo",
  botToken: "test-token",
  sessionSecret: "x".repeat(32),
  supportUrl: "https://t.me/vireflow_support",
};

describe("каркас приложения панели", () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    server = createServer(createApp(TEST_CONFIG));
    await new Promise((resolve) => server.listen(0, resolve));
    baseUrl = `http://localhost:${server.address().port}`;
  });

  afterAll(() => new Promise((resolve) => server.close(resolve)));

  it("отвечает на health-check", async () => {
    const res = await fetch(`${baseUrl}/admin/_panel/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok", repo: "owner/test-repo" });
  });

  // /auth, /account, /history теперь настоящие — тесты в соответствующих *.test.js.
  it.each(["/users", "/export"])(
    "отдаёт заглушку для %s",
    async (route) => {
      const res = await fetch(`${baseUrl}/admin/_panel${route}`);
      expect(res.status).toBe(200);
      expect(await res.text()).toContain("в разработке");
    },
  );

  it("отвечает 404 вне известных путей", async () => {
    const res = await fetch(`${baseUrl}/admin/_panel/несуществующий`);
    expect(res.status).toBe(404);
  });
});
