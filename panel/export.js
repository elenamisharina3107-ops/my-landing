import { Readable } from "node:stream";
import { downloadRepoZip } from "./github.js";
import { getSession } from "./session.js";
import { loginUrlWithRedirect } from "./auth.js";
import { sendHtml } from "./http-utils.js";

const SELF_PATH = "/admin/_panel/export";
const BRANCH = "main";

/**
 * /admin/_panel/export — отдаёт архив содержимого репозитория клиента.
 *
 * Самый простой надёжный вариант (и он же предложен в плане): проксировать
 * GitHub-эндпоинт zipball репозитория с токеном бота, а не собирать архив
 * вручную по отдельным путям. Это отдаёт архив целиком (включая код
 * шаблона, не только src/_data и src/content) — сознательное упрощение:
 * репозиторий и так на аккаунте клиента и целиком принадлежит ему
 * (независимость с первого дня, см. план), так что «экспортировать не то»
 * тут не про утечку чужого — просто чуть больше, чем голый контент.
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

  let upstream;
  try {
    upstream = await downloadRepoZip(ctx.config, BRANCH);
  } catch (err) {
    console.error(err);
    sendHtml(res, 502, "Не удалось получить архив из GitHub. Попробуйте позже.");
    return;
  }

  const filename = `site-export-${new Date().toISOString().slice(0, 10)}.zip`;
  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${filename}"`,
  });
  Readable.fromWeb(upstream.body).pipe(res);
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}
