import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VIEWS_DIR = path.dirname(fileURLToPath(import.meta.url));

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Простая подстановка {{ключ}} в HTML-шаблон.
 * По умолчанию значения экранируются; ключи, перечисленные в rawKeys,
 * подставляются как есть (для готовых HTML-кусков вроде блока ошибки).
 */
export function renderTemplate(name, vars = {}, rawKeys = []) {
  const filePath = path.join(VIEWS_DIR, name);
  let html = readFileSync(filePath, "utf8");

  for (const [key, value] of Object.entries(vars)) {
    const needle = `{{${key}}}`;
    const replacement = rawKeys.includes(key) ? String(value) : escapeHtml(value);
    html = html.replaceAll(needle, replacement);
  }

  return html;
}
