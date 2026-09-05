import { usersFilePath } from "./config.js";
import { setPassword as setUserPassword } from "./users.js";
import { getSession } from "./session.js";
import { readBody, sendHtml, escapeHtml } from "./http-utils.js";
import { renderTemplate } from "./views/render.js";
import { loginUrlWithRedirect } from "./auth.js";

const SELF_PATH = "/admin/_panel/account";
const MIN_LENGTH = 8;

/**
 * Смена собственного пароля. Первый вход нового пользователя приводит сюда
 * принудительно (auth.js редиректит при mustChangePassword=true), но страница
 * работает и по прямому заходу — тогда без сессии сначала шлём на вход.
 */
export async function handle(req, res, ctx) {
  const session = getSession(req, ctx.config.sessionSecret);
  if (!session) {
    redirect(res, loginUrlWithRedirect(SELF_PATH));
    return;
  }

  if (req.method === "GET") {
    sendHtml(res, 200, renderForm({ email: session.email }));
    return;
  }

  if (req.method !== "POST") {
    sendHtml(res, 405, "Метод не поддерживается");
    return;
  }

  const body = await readBody(req);
  const password = body.password || "";
  const confirm = body.confirm || "";

  const error = validate(password, confirm);
  if (error) {
    sendHtml(res, 400, renderForm({ email: session.email, error }));
    return;
  }

  await setUserPassword(usersFilePath(), session.email, password);
  sendHtml(res, 200, renderSuccess());
}

function validate(password, confirm) {
  if (password.length < MIN_LENGTH) return `Пароль должен быть не короче ${MIN_LENGTH} символов.`;
  if (password !== confirm) return "Пароли не совпадают.";
  return null;
}

function renderForm({ email, error }) {
  return renderTemplate(
    "account.html",
    {
      ACTION: SELF_PATH,
      EMAIL: email,
      MESSAGE_BLOCK: error ? `<p class="error">${escapeHtml(error)}</p>` : "",
    },
    ["MESSAGE_BLOCK"],
  );
}

function renderSuccess() {
  return (
    `<!doctype html><html lang="ru"><meta charset="utf-8"><title>Пароль изменён</title>` +
    `<body style="font:16px sans-serif;padding:2rem;max-width:32rem">` +
    `<p>Пароль сохранён. Теперь войдите с ним в панель:</p>` +
    `<p><a href="/admin/">Перейти в панель →</a></p>` +
    `</body></html>`
  );
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}
