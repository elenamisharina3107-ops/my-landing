import { createServer } from "node:http";
import { loadConfig } from "./config.js";
import { sendJson } from "./http-utils.js";
import * as auth from "./auth.js";
import * as account from "./account.js";
import * as users from "./users.js";
import * as history from "./history.js";
import * as exportRoute from "./export.js";
import * as start from "./start.js";

const BASE = "/admin/_panel";
const PORT = process.env.PORT || 3000;

/**
 * Роутер приложения панели. Не зависит от того, поднят ли сервер
 * по-настоящему (createApp()) или вызывается напрямую из теста.
 */
export function createApp(config) {
  const routes = {
    "": start.handle, // /admin/_panel — «с чего начать»
    "/": start.handle, // /admin/_panel/ — то же самое, со слэшем
    "/auth": auth.handle,
    "/account": account.handle,
    "/users": users.handle,
    "/history": history.handle,
    "/export": exportRoute.handle,
  };

  return async function handleRequest(req, res) {
    const url = new URL(req.url, "http://localhost");
    const pathname = url.pathname;

    if (pathname === `${BASE}/health`) {
      sendJson(res, 200, { status: "ok", repo: config.repo });
      return;
    }

    const routePath = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : null;
    // routePath может быть "" (запрос точно на /admin/_panel) — сравниваем
    // с null явно, иначе пустая строка (falsy) ложно считалась бы «нет пути».
    const handler = routePath !== null ? routes[routePath] : undefined;

    if (!handler) {
      sendJson(res, 404, { error: "Страница не найдена" });
      return;
    }

    try {
      await handler(req, res, { config, url });
    } catch (err) {
      console.error(err);
      sendJson(res, 500, { error: "Внутренняя ошибка сервера" });
    }
  };
}

// Запуск только когда файл выполняется напрямую (node server.js),
// а не когда его импортирует тест.
if (import.meta.url === `file://${process.argv[1]}`) {
  const config = loadConfig();
  const app = createApp(config);
  createServer(app).listen(PORT, () => {
    console.log(`Панель слушает http://localhost:${PORT}${BASE}/health`);
  });
}
