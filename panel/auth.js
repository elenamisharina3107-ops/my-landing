import { usersFilePath } from "./config.js";
import { findUserByEmail, setPassword as setUserPassword } from "./users.js";
import { verifyPassword } from "./password.js";
import { createSessionToken, setSessionCookie } from "./session.js";
import { readBody, sendHtml, escapeHtml } from "./http-utils.js";
import { renderTemplate } from "./views/render.js";

// Хэш несуществующего пароля — сравниваем с ним, когда почта не найдена,
// чтобы по времени ответа нельзя было угадать, зарегистрирован ли email.
const DUMMY_HASH = "$2a$10$K0vElKMKNaLUbRDxRXENOeQ7RFnUqQdCALCi3kXWk1AC461Bi8RDW";

export const LOGIN_PATH = "/admin/_panel/auth";

// Прямой заход на /, /account, /users, /history (не из попапа Sveltia) после
// входа возвращает сюда через ?redirect=... — открытый список путей,
// чтобы нельзя было увести на произвольный внешний адрес.
const SAFE_REDIRECTS = new Set([
  "/admin/_panel/",
  "/admin/_panel/account",
  "/admin/_panel/users",
  "/admin/_panel/history",
  "/admin/_panel/export",
  "/admin/",
]);

/** Ссылка на вход с возвратом на нужную страницу панели (используют account.js и т.д.). */
export function loginUrlWithRedirect(path) {
  return `${LOGIN_PATH}?redirect=${encodeURIComponent(path)}`;
}

/**
 * Sveltia (протокол Decap) открывает эту страницу во всплывающем окне как
 * `${base_url}${auth_endpoint}?provider=github&scope=repo&site_id=...`
 * (см. src/admin/config.yml: base_url: /admin/_panel, auth_endpoint: auth).
 *
 * GET  — наша форма входа (email + пароль) вместо экрана GitHub.
 * POST — проверяем email/пароль сами; при успехе не идём в GitHub вообще,
 *        а сразу отдаём токен бота-соавтора репозитория (Задача 2.2 плана,
 *        решение 4). Клиент GitHub не видит.
 *
 * Хендшейк с открывшим окном — протокол Decap/Netlify CMS: попап шлёт
 * "authorizing:<provider>", затем, получив любой ответ от opener,
 * "authorization:<provider>:success:<JSON>" с токеном.
 */
export async function handle(req, res, ctx) {
  const provider = ctx.url.searchParams.get("provider") || "github";
  const action = ctx.url.pathname + ctx.url.search;

  if (req.method === "GET") {
    sendHtml(res, 200, renderLoginForm({ action, email: "" }));
    return;
  }

  if (req.method !== "POST") {
    sendHtml(res, 405, "Метод не поддерживается");
    return;
  }

  const body = await readBody(req);
  const email = (body.email || "").trim();
  const password = body.password || "";

  const user = email && findUserByEmail(usersFilePath(), email);
  // Даже если пользователя нет, всё равно считаем bcrypt на фиктивном хэше —
  // чтобы по времени ответа нельзя было угадать, есть такая почта или нет.
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !passwordOk || !password) {
    sendHtml(
      res,
      401,
      renderLoginForm({
        action,
        email,
        error: "Неверная почта или пароль.",
      }),
    );
    return;
  }

  const token = createSessionToken({ email: user.email, role: user.role }, ctx.config.sessionSecret);
  setSessionCookie(res, token);

  if (user.mustChangePassword) {
    redirect(res, "/admin/_panel/account");
    return;
  }

  const redirectTo = ctx.url.searchParams.get("redirect");
  if (redirectTo && SAFE_REDIRECTS.has(redirectTo)) {
    redirect(res, redirectTo);
    return;
  }

  sendHtml(res, 200, renderHandshakeSuccess({ provider, token: ctx.config.botToken }));
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

function renderLoginForm({ action, email, error }) {
  return renderTemplate(
    "login.html",
    {
      ACTION: action,
      EMAIL: email,
      ERROR_BLOCK: error ? `<p class="error">${escapeHtml(error)}</p>` : "",
    },
    ["ERROR_BLOCK"], // остальные значения экранируются render.js как обычно
  );
}

/** JS-строковый литерал без риска вырваться из <script> — на случай странных символов в токене. */
function jsStringLiteral(value) {
  return JSON.stringify(value).replaceAll("</", "<\\/");
}

function renderHandshakeSuccess({ provider, token }) {
  const safeProvider = /^[a-z0-9_-]+$/i.test(provider) ? provider : "github";
  const successMessage = jsStringLiteral(
    `authorization:${safeProvider}:success:${JSON.stringify({ token, provider: safeProvider })}`,
  );
  const handshakeMessage = jsStringLiteral(`authorizing:${safeProvider}`);

  return (
    `<!doctype html><html lang="ru"><meta charset="utf-8"><title>Вход выполнен</title>` +
    `<body style="font:16px sans-serif;padding:2rem">Вход выполнен, окно закроется…` +
    `<script>` +
    `(function () {` +
    `  function receiveMessage(e) {` +
    `    window.opener.postMessage(${successMessage}, e.origin);` +
    `    window.removeEventListener('message', receiveMessage, false);` +
    `  }` +
    `  window.addEventListener('message', receiveMessage, false);` +
    `  window.opener.postMessage(${handshakeMessage}, '*');` +
    `})();` +
    `</script>` +
    `</body></html>`
  );
}
