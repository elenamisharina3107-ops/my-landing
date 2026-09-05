import { describe, it, expect, vi, afterEach } from "vitest";
import { downloadRepoZip } from "../../panel/github.js";

const CONFIG = { repo: "owner/test-repo", botToken: "test-token" };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("downloadRepoZip", () => {
  it("не следует за редиректом автоматически — сам повторяет запрос на codeload с токеном", async () => {
    const calls = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url, init = {}) => {
        calls.push({ url: String(url), headers: init.headers, redirect: init.redirect });
        if (String(url).includes("api.github.com")) {
          return Promise.resolve(
            new Response(null, {
              status: 302,
              headers: { Location: "https://codeload.github.com/owner/test-repo/legacy.zip/main" },
            }),
          );
        }
        return Promise.resolve(new Response("PK\x03\x04-fake-zip-bytes"));
      }),
    );

    const res = await downloadRepoZip(CONFIG, "main");
    expect(await res.text()).toBe("PK\x03\x04-fake-zip-bytes");

    expect(calls[0].url).toContain("/repos/owner/test-repo/zipball/main");
    expect(calls[0].redirect).toBe("manual"); // не даём fetch самому съесть Authorization на смене хоста
    expect(calls[1].url).toBe("https://codeload.github.com/owner/test-repo/legacy.zip/main");
    expect(calls[1].headers.Authorization).toBe("Bearer test-token");
  });

  it("бросает ошибку, если GitHub отвечает не 2xx/3xx", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("", { status: 404 }))));
    await expect(downloadRepoZip(CONFIG, "main")).rejects.toThrow("404");
  });
});
