import { sendHtml } from "../http-utils.js";

/** Временная заглушка для ещё не реализованного роута (снимается по мере работы над этапом 2/4). */
export function stubPage(title) {
  return async function handle(req, res) {
    sendHtml(
      res,
      200,
      `<!doctype html><html lang="ru"><meta charset="utf-8">` +
        `<title>${title}</title><body style="font:16px sans-serif;padding:2rem">` +
        `<p>«${title}» — в разработке.</p></body></html>`,
    );
  };
}
