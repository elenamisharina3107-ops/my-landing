import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Секреты живут вне git (panel/store/config.json — в .gitignore) и,
// на боевом сервере, вне веб-корня. Путь можно переопределить переменной
// окружения — так на Beget можно вынести файл ещё выше по дереву папок.
const DEFAULT_PATH = path.join(__dirname, "store", "config.json");
const DEFAULT_USERS_PATH = path.join(__dirname, "store", "users.json");

/** Путь к users.json — тоже вне git, тоже можно переопределить переменной окружения. */
export function usersFilePath() {
  return process.env.PANEL_USERS_PATH || DEFAULT_USERS_PATH;
}

/**
 * Читает и проверяет конфиг панели.
 * @param {string} [configPath]
 * @returns {{ repo: string, botToken: string, sessionSecret: string, supportUrl: string }}
 */
export function loadConfig(configPath = process.env.PANEL_CONFIG_PATH || DEFAULT_PATH) {
  let raw;
  try {
    raw = readFileSync(configPath, "utf8");
  } catch (err) {
    throw new Error(
      `Не найден конфиг панели: ${configPath}\n` +
        `Скопируйте panel/store/config.example.json → panel/store/config.json и заполните.`,
      { cause: err },
    );
  }

  const config = JSON.parse(raw);
  const required = ["repo", "botToken", "sessionSecret", "supportUrl"];
  const missing = required.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`В конфиге панели (${configPath}) не заполнены поля: ${missing.join(", ")}`);
  }
  if (config.sessionSecret.length < 32) {
    throw new Error("sessionSecret в конфиге панели должен быть не короче 32 символов");
  }

  return config;
}
