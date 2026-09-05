import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { listVersions, restoreVersion } from "../../panel/history.js";

const CONFIG = { repo: "owner/test-repo", botToken: "test-token" };

function jsonResponse(body, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }),
  );
}

function commit(sha, { date, message, author = "Лена" }) {
  return { sha, commit: { message, author: { name: author, date } } };
}

let calls;
let fetchMock;

beforeEach(() => {
  calls = [];
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("история версий — список", () => {
  it("объединяет коммиты из трёх путей, убирает повторы, сортирует по дате", async () => {
    // Один и тот же коммит "c2" трогает и _data, и content — должен остаться один раз.
    const c1 = commit("c1", { date: "2026-01-01T10:00:00Z", message: "feat: заголовок\n\nподробности" });
    const c2 = commit("c2", { date: "2026-01-03T10:00:00Z", message: "feat: услуга" });
    const c3 = commit("c3", { date: "2026-01-02T10:00:00Z", message: "feat: картинка" });

    fetchMock.mockImplementation((url) => {
      calls.push(String(url));
      if (String(url).includes("path=src%2F_data")) return jsonResponse([c2, c1]);
      if (String(url).includes("path=src%2Fcontent")) return jsonResponse([c2, c3]);
      if (String(url).includes("path=src%2Fuploads")) return jsonResponse([]);
      throw new Error("неожиданный запрос: " + url);
    });

    const versions = await listVersions(CONFIG, { limit: 10 });

    expect(versions.map((v) => v.sha)).toEqual(["c2", "c3", "c1"]);
    expect(versions[0].message).toBe("feat: услуга");
    expect(versions[2].message).toBe("feat: заголовок"); // только первая строка
    expect(versions[0].author).toBe("Лена");
  });
});

describe("история версий — откат", () => {
  it("создаёт новый коммит с файлами целевой версии, лишние файлы контента удаляет, историю не переписывает", async () => {
    const targetTree = {
      tree: [
        { path: "src/_data/hero.json", mode: "100644", type: "blob", sha: "blob-hero-old" },
        { path: "src/content/services/a.md", mode: "100644", type: "blob", sha: "blob-a" },
      ],
    };
    const headTree = {
      tree: [
        { path: "src/_data/hero.json", mode: "100644", type: "blob", sha: "blob-hero-new" },
        { path: "src/content/services/a.md", mode: "100644", type: "blob", sha: "blob-a" },
        { path: "src/content/services/new.md", mode: "100644", type: "blob", sha: "blob-new" },
        { path: "package.json", mode: "100644", type: "blob", sha: "blob-pkg" }, // не контент — не трогаем
      ],
    };

    fetchMock.mockImplementation((url, init = {}) => {
      const u = String(url);
      calls.push({ url: u, method: init.method || "GET", body: init.body });

      if (u.endsWith("/git/ref/heads/main")) return jsonResponse({ object: { sha: "head-sha" } });
      if (u.endsWith("/git/commits/target-sha")) {
        return jsonResponse({ sha: "target-sha", tree: { sha: "tree-target" }, author: { date: "2026-01-01T00:00:00Z" } });
      }
      if (u.endsWith("/git/commits/head-sha")) {
        return jsonResponse({ sha: "head-sha", tree: { sha: "tree-head" }, author: { date: "2026-01-05T00:00:00Z" } });
      }
      if (u.endsWith("/git/trees/tree-target?recursive=1")) return jsonResponse(targetTree);
      if (u.endsWith("/git/trees/tree-head?recursive=1")) return jsonResponse(headTree);
      if (u.endsWith("/git/trees") && init.method === "POST") return jsonResponse({ sha: "new-tree-sha" });
      if (u.endsWith("/git/commits") && init.method === "POST") return jsonResponse({ sha: "new-commit-sha" });
      if (u.endsWith("/git/refs/heads/main") && init.method === "PATCH") return jsonResponse({ ok: true });

      throw new Error("неожиданный запрос: " + init.method + " " + u);
    });

    const result = await restoreVersion(CONFIG, { branch: "main", sha: "target-sha" });
    expect(result.sha).toBe("new-commit-sha");

    const createTreeCall = calls.find((c) => c.url.endsWith("/git/trees") && c.method === "POST");
    const treeBody = JSON.parse(createTreeCall.body);
    expect(treeBody.base_tree).toBe("tree-head");
    expect(treeBody.tree).toEqual(
      expect.arrayContaining([
        { path: "src/_data/hero.json", mode: "100644", type: "blob", sha: "blob-hero-old" },
        { path: "src/content/services/a.md", mode: "100644", type: "blob", sha: "blob-a" },
        { path: "src/content/services/new.md", mode: "100644", type: "blob", sha: null },
      ]),
    );
    // package.json — не контент, в дереве изменений его нет вообще:
    expect(treeBody.tree.some((e) => e.path === "package.json")).toBe(false);

    const createCommitCall = calls.find((c) => c.url.endsWith("/git/commits") && c.method === "POST");
    const commitBody = JSON.parse(createCommitCall.body);
    expect(commitBody.parents).toEqual(["head-sha"]);
    expect(commitBody.tree).toBe("new-tree-sha");

    const updateRefCall = calls.find((c) => c.url.endsWith("/git/refs/heads/main"));
    expect(updateRefCall.method).toBe("PATCH");
    expect(JSON.parse(updateRefCall.body)).toEqual({ sha: "new-commit-sha" });
  });
});
