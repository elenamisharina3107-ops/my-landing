import { clearSessionCookie } from "./session.js";

const LOGIN_PATH = "/admin/_panel/auth";

/**
 * Выход из наших страниц (/account, /users, /history, /admin/_panel/).
 * Не трогает токен бота у Sveltia — тот живёт в памяти открытой вкладки
 * редактора и пропадает при её закрытии, эта кука касается только
 * сессии для страниц, которые мы сами рисуем.
 */
export async function handle(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Метод не поддерживается");
    return;
  }

  clearSessionCookie(res);
  res.writeHead(302, { Location: LOGIN_PATH });
  res.end();
}
