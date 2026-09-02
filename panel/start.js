import { listVersions } from "./history.js";
import { getSession } from "./session.js";
import { loginUrlWithRedirect } from "./auth.js";
import { sendHtml, escapeHtml } from "./http-utils.js";
import { renderTemplate } from "./views/render.js";

export const SELF_PATH = "/admin/_panel/";

/**
 * «С чего начать» — настоящая домашняя страница панели, отдельная от
 * редактора Sveltia: в интерфейс CMS такое не встроить (см. находку в
 * Задаче 1.3 — нет точки для кастомного дашборда), поэтому это отдельная
 * страница нашего приложения, куда клиент возвращается по прямой ссылке.
 */
export async function handle(req, res, ctx) {
  const session = getSession(req, ctx.config.sessionSecret);
  if (!session) {
    redirect(res, loginUrlWithRedirect(SELF_PATH));
    return;
  }
  if (req.method !== "GET") {
    sendHtml(res, 405, "Метод не поддерживается");
    return;
  }

  const html = renderTemplate(
    "start.html",
    {
      EMAIL: session.email,
      SUPPORT_URL: ctx.config.supportUrl,
      RECENT: await recentChangesBlock(ctx.config),
      USERS_CARD: session.role === "owner" ? usersCard() : "",
    },
    ["RECENT", "USERS_CARD"],
  );

  sendHtml(res, 200, html);
}

async function recentChangesBlock(config) {
  let versions;
  try {
    versions = await listVersions(config, { limit: 5 });
  } catch (err) {
    console.error(err);
    return `<p class="empty">Не удалось загрузить последние изменения.</p>`;
  }

  if (versions.length === 0) {
    return `<p class="empty">Изменений пока нет.</p>`;
  }

  const items = versions
    .map((v) => `<li><time>${formatDate(v.date)}</time>${escapeHtml(v.message)}</li>`)
    .join("");
  return `<ul class="recent">${items}</ul>`;
}

function usersCard() {
  return `<a class="card" href="/admin/_panel/users">
    <strong>Пользователи</strong>
    <span>Добавить редактора, сбросить пароль</span>
  </a>`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" });
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}
