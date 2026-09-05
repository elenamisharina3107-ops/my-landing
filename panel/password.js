import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";

const SALT_ROUNDS = 10;

// Без символов, которые легко перепутать на глаз или надиктовать по телефону
// (0/O, 1/l/I и т.п.) — временный пароль клиент часто вводит вручную.
const TEMP_PASSWORD_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";

export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

/** Временный пароль (12 символов) для нового пользователя / сброса пароля. */
export function generateTempPassword(length = 12) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += TEMP_PASSWORD_ALPHABET[randomInt(TEMP_PASSWORD_ALPHABET.length)];
  }
  return result;
}
