import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { hashPassword, generateTempPassword } from "./password.js";

const ROLES = ["owner", "editor"];

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
