import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { hashPassword, generateTempPassword } from "./password.js";
import { usersFilePath } from "./config.js";
import { getSession } from "./session.js";
import { readBody, sendHtml, escapeHtml } from "./http-utils.js";
import { renderTemplate } from "./views/render.js";
import { loginUrlWithRedirect } from "./auth.js";

const ROLES = ["owner", "editor"];
const SELF_PATH = "/admin/_panel/users";
// Не строгая проверка почты по RFC, а простая защита от мусора/спецсимволов
// в поле, которое потом выводится в HTML (см. escapeHtml в http-utils.js).
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

function readUsers(filePath) {
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

/** Запись temp-файл + rename — чтобы падение посередине записи не побило users.json. */
function writeUsersAtomic(filePath, users) {
  const tmpPath = `${filePath}.tmp-${randomBytes(6).toString("hex")}`;
  writeFileSync(tmpPath, JSON.stringify(users, null, 2) + "\n", "utf8");
  renameSync(tmpPath, filePath);
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function findIndexByEmail(users, email) {
  const target = normalizeEmail(email);
  return users.findIndex((u) => normalizeEmail(u.email) === target);
}

function countOwners(users) {
  return users.filter((u) => u.role === "owner").length;
}

/** Без passwordHash — для показа в панели (экран пользователей). */
export function listUsers(filePath) {
  return readUsers(filePath).map(({ passwordHash, ...safe }) => safe);
}

/** С passwordHash — для проверки входа (panel/auth.js), не отдаётся клиенту. */
export function findUserByEmail(filePath, email) {
  const users = readUsers(filePath);
  const index = findIndexByEmail(users, email);
  return index === -1 ? null : users[index];
}

export async function createUser(filePath, { email, role }) {
  if (!ROLES.includes(role)) {
    throw new Error(`Неизвестная роль "${role}", допустимо: ${ROLES.join(", ")}`);
  }
  if (!EMAIL_PATTERN.test(email ?? "")) {
    throw new Error(`Похоже на неверную почту: "${email}"`);
  }
  const users = readUsers(filePath);
  if (findIndexByEmail(users, email) !== -1) {
    throw new Error(`Пользователь с почтой ${email} уже есть`);
  }

  const tempPassword = generateTempPassword();
  users.push({
    email: normalizeEmail(email),
    passwordHash: await hashPassword(tempPassword),
    role,
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
  });
  writeUsersAtomic(filePath, users);

  return { email: normalizeEmail(email), role, tempPassword };
}

export async function resetPassword(filePath, email) {
  const users = readUsers(filePath);
  const index = findIndexByEmail(users, email);
  if (index === -1) throw new Error(`Пользователь с почтой ${email} не найден`);

  const tempPassword = generateTempPassword();
  users[index] = {
    ...users[index],
    passwordHash: await hashPassword(tempPassword),
    mustChangePassword: true,
  };
  writeUsersAtomic(filePath, users);

  return { email: users[index].email, tempPassword };
}

export async function setPassword(filePath, email, newPlainPassword) {
  const users = readUsers(filePath);
  const index = findIndexByEmail(users, email);
  if (index === -1) throw new Error(`Пользователь с почтой ${email} не найден`);

  users[index] = {
    ...users[index],
    passwordHash: await hashPassword(newPlainPassword),
    mustChangePassword: false,
  };
  writeUsersAtomic(filePath, users);
}

export function deleteUser(filePath, email) {
  const users = readUsers(filePath);
  const index = findIndexByEmail(users, email);
  if (index === -1) throw new Error(`Пользователь с почтой ${email} не найден`);

  if (users[index].role === "owner" && countOwners(users) <= 1) {
    throw new Error("Нельзя удалить последнего владельца");
  }

  users.splice(index, 1);
  writeUsersAtomic(filePath, users);
}

/**
 * Экран /admin/_panel/users — только владелец (owner). Редактора сюда не
 * пускаем вообще: роли отличаются именно доступом к управлению людьми,
 * весь остальной контент редактор правит наравне с владельцем.
 */
export async function handle(req, res, ctx) {
  const session = getSession(req, ctx.config.sessionSecret);
  if (!session) {
    redirect(res, loginUrlWithRedirect(SELF_PATH));
    return;
  }
  if (session.role !== "owner") {
    redirect(res, "/admin/");
    return;
  }

  const path = usersFilePath();

  if (req.method === "GET") {
    sendHtml(res, 200, renderPage(path, {}));
    return;
  }

  if (req.method !== "POST") {
    sendHtml(res, 405, "Метод не поддерживается");
    return;
  }

  const body = await readBody(req);
  try {
    if (body.action === "create") {
      const created = await createUser(path, { email: body.email, role: body.role });
      sendHtml(
        res,
        200,
        renderPage(path, {
          message:
            `Пользователь ${created.email} (${roleLabel(created.role)}) создан. ` +
            `Временный пароль: ${created.tempPassword} — сообщите его отдельно, ` +
            `здесь он показывается только один раз.`,
        }),
      );
      return;
    }

    if (body.action === "reset") {
      const result = await resetPassword(path, body.email);
      sendHtml(
        res,
        200,
        renderPage(path, {
          message: `Новый временный пароль для ${result.email}: ${result.tempPassword}`,
        }),
      );
      return;
    }

    if (body.action === "delete") {
      deleteUser(path, body.email);
      redirect(res, SELF_PATH);
      return;
    }

    sendHtml(res, 400, renderPage(path, { error: "Неизвестное действие." }));
  } catch (err) {
    sendHtml(res, 400, renderPage(path, { error: err.message }));
  }
}

function roleLabel(role) {
  return role === "owner" ? "Владелец" : "Редактор";
}

function renderPage(path, { message, error }) {
  let users;
  try {
    users = listUsers(path);
  } catch {
    users = [];
  }

  const messageBlock = error
    ? `<p class="error">${escapeHtml(error)}</p>`
    : message
      ? `<p class="message">${escapeHtml(message)}</p>`
      : "";

  const rows = users.length === 0 ? `<p class="empty">Пользователей нет.</p>` : usersTable(users);

  return renderTemplate("users.html", { MESSAGE_BLOCK: messageBlock, ROWS: rows }, [
    "MESSAGE_BLOCK",
    "ROWS",
  ]);
}

function usersTable(users) {
  const rows = users
    .map(
      (u) => `<tr>
        <td>${escapeHtml(u.email)}</td>
        <td>${roleLabel(u.role)}</td>
        <td>${u.mustChangePassword ? "Требуется смена пароля" : "Активен"}</td>
        <td>
          <form class="inline" method="post" action="${SELF_PATH}">
            <input type="hidden" name="action" value="reset">
            <input type="hidden" name="email" value="${escapeHtml(u.email)}">
            <button type="submit">Сбросить пароль</button>
          </form>
          <form class="inline" method="post" action="${SELF_PATH}" data-confirm="Удалить ${escapeHtml(u.email)}?">
            <input type="hidden" name="action" value="delete">
            <input type="hidden" name="email" value="${escapeHtml(u.email)}">
            <button type="submit" class="danger">Удалить</button>
          </form>
        </td>
      </tr>`,
    )
    .join("");

  return `<table>
    <thead><tr><th>Почта</th><th>Роль</th><th>Статус</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}
