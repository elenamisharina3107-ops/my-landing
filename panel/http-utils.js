/** Мелкие помощники поверх голого node:http — фреймворк тут не нужен. */

/**
 * Единственная функция экранирования HTML на весь panel/ — экранирует все
 * пять спецсимволов (включая кавычки), чтобы значение было безопасно
 * вставлять и в текст, и в атрибут в двойных или одинарных кавычках.
 *
 * Важно: этого экранирования НЕДОСТАТОЧНО для значения, которое затем
 * попадает в JS-код инлайновых обработчиков (onclick="...", onsubmit="...")
 * — атрибут декодируется браузером обратно в исходные символы ДО того, как
 * его содержимое компилируется как JavaScript, так что экранированная
 * кавычка внутри onsubmit просто перестаёт быть экранированной и снова
 * ломает JS-строку. Поэтому в шаблонах вместо onsubmit="...${value}..."
 * используется data-confirm="${escapeHtml(value)}" + общий <script>,
 * читающий его как данные, а не как код (см. history.html, users.html).
 */
export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function sendHtml(res, status, html) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

export function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

const MAX_BODY_BYTES = 1024 * 1024; // 1 МБ — с запасом для форм входа/паролей

/** Читает тело запроса и парсит как application/x-www-form-urlencoded или JSON. */
export function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Тело запроса слишком большое"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      const contentType = req.headers["content-type"] || "";
      try {
        if (contentType.includes("application/json")) {
          resolve(raw ? JSON.parse(raw) : {});
        } else {
          resolve(Object.fromEntries(new URLSearchParams(raw)));
        }
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}
