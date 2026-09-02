import {
  CONTENT_PATHS,
  listCommitsForPath,
  getBranchHeadSha,
  getCommit,
  getTree,
  createTree,
  createCommit,
  updateRef,
} from "./github.js";
import { getSession } from "./session.js";
import { readBody, sendHtml } from "./http-utils.js";
import { renderTemplate } from "./views/render.js";
import { loginUrlWithRedirect } from "./auth.js";

const DEFAULT_BRANCH = "main";
const SELF_PATH = "/admin/_panel/history";

/**
 * Версии контента — коммиты в branch, затронувшие src/_data, src/content
 * или src/uploads. «Что изменилось» — заголовок коммита (первая строка
 * сообщения), без построения дифа.
 */
export async function listVersions(config, { branch = DEFAULT_BRANCH, limit = 20 } = {}) {
  const perPathCommits = await Promise.all(
    CONTENT_PATHS.map((path) => listCommitsForPath(config, { branch, path, perPage: limit })),
  );

  const bySha = new Map();
  for (const commits of perPathCommits) {
    for (const c of commits) {
      if (!bySha.has(c.sha)) bySha.set(c.sha, c);
    }
  }

  return [...bySha.values()]
    .map((c) => ({
      sha: c.sha,
      shortSha: c.sha.slice(0, 7),
      date: c.commit.author?.date ?? c.commit.committer?.date,
      author: c.commit.author?.name ?? "неизвестно",
      message: (c.commit.message ?? "").split("\n")[0],
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
}

function isContentBlob(entry) {
  return (
    entry.type === "blob" &&
    CONTENT_PATHS.some((p) => entry.path === p || entry.path.startsWith(`${p}/`))
  );
}

/**
 * «Вернуть эту версию» — новый коммит, возвращающий файлы контента к
 * состоянию версии sha, поверх текущего HEAD. История не переписывается:
 * это обычный новый коммит, не force-push и не reset.
 */
export async function restoreVersion(config, { branch = DEFAULT_BRANCH, sha }) {
  const [targetCommit, headSha] = await Promise.all([
    getCommit(config, sha),
    getBranchHeadSha(config, branch),
  ]);
  const headCommit = await getCommit(config, headSha);

  const [targetTree, headTree] = await Promise.all([
    getTree(config, targetCommit.tree.sha),
    getTree(config, headCommit.tree.sha),
  ]);

  const targetEntries = targetTree.tree.filter(isContentBlob);
  const targetPaths = new Set(targetEntries.map((e) => e.path));

  // Файлы контента, которые есть сейчас, но которых не было в целевой версии —
  // при откате должны исчезнуть, а не просто «зависнуть» с текущим содержимым.
  const deletions = headTree.tree
    .filter(isContentBlob)
    .filter((e) => !targetPaths.has(e.path))
    .map((e) => ({ path: e.path, mode: e.mode, type: e.type, sha: null }));

  const changes = [
    ...targetEntries.map((e) => ({ path: e.path, mode: e.mode, type: e.type, sha: e.sha })),
    ...deletions,
  ];

  if (changes.length === 0) {
    throw new Error("Нет файлов контента для отката — проверьте sha версии");
  }

  const newTree = await createTree(config, { baseTree: headCommit.tree.sha, tree: changes });
  const message = `Откат к версии от ${targetCommit.author?.date ?? "?"} (${sha.slice(0, 7)}) — /admin/_panel/history`;
  const newCommit = await createCommit(config, { message, tree: newTree.sha, parents: [headSha] });
  await updateRef(config, branch, newCommit.sha);

  return { sha: newCommit.sha };
}

/**
 * Страница «История» — доступна и владельцу, и редактору (роли отличаются
 * только доступом к /users, см. Задача 4.3), список версий + кнопка «Вернуть».
 */
export async function handle(req, res, ctx) {
  const session = getSession(req, ctx.config.sessionSecret);
  if (!session) {
    redirect(res, loginUrlWithRedirect(SELF_PATH));
    return;
  }

  if (req.method === "POST") {
    const body = await readBody(req);
    if (!body.sha) {
      sendHtml(res, 400, await renderPage({ error: "Не указана версия для отката." }));
      return;
    }
    try {
      await restoreVersion(ctx.config, { sha: body.sha });
      redirect(res, `${SELF_PATH}?restored=1`);
    } catch (err) {
      sendHtml(res, 502, await renderPage({ error: describeError(err) }));
    }
    return;
  }

  if (req.method !== "GET") {
    sendHtml(res, 405, "Метод не поддерживается");
    return;
  }

  const restored = ctx.url.searchParams.get("restored") === "1";
  try {
    const versions = await listVersions(ctx.config);
    sendHtml(res, 200, await renderPage({ versions, restored }));
  } catch (err) {
    sendHtml(res, 502, await renderPage({ error: describeError(err) }));
  }
}

function describeError(err) {
  // Сообщение GitHub API клиенту не показываем — может содержать технические
  // детали. В интерфейсе — общая формулировка, подробности только в логах.
  console.error(err);
  return "Не удалось получить историю из GitHub. Попробуйте обновить страницу позже.";
}

async function renderPage({ versions = [], error, restored }) {
  const messageBlock = error
    ? `<p class="error">${error}</p>`
    : restored
      ? `<p class="message">Версия восстановлена.</p>`
      : "";

  const rows =
    versions.length === 0 && !error
      ? `<p class="empty">Изменений пока нет.</p>`
      : versionsTable(versions);

  return renderTemplate("history.html", { MESSAGE_BLOCK: messageBlock, ROWS: rows }, [
    "MESSAGE_BLOCK",
    "ROWS",
  ]);
}

function versionsTable(versions) {
  const rows = versions
    .map(
      (v) => `<tr>
        <td>${formatDate(v.date)}</td>
        <td>${escapeHtml(v.author)}</td>
        <td>${escapeHtml(v.message)} <code>${v.shortSha}</code></td>
        <td>
          <form method="post" action="${SELF_PATH}" onsubmit="return confirm('Вернуть версию от ${formatDate(v.date)}?');">
            <input type="hidden" name="sha" value="${v.sha}">
            <button type="submit">Вернуть эту версию</button>
          </form>
        </td>
      </tr>`,
    )
    .join("");

  return `<table>
    <thead><tr><th>Когда</th><th>Кто</th><th>Что изменилось</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" });
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}
