import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { verifyPassword } from "../../panel/password.js";
import {
  listUsers,
  findUserByEmail,
  createUser,
  resetPassword,
  setPassword,
  deleteUser,
} from "../../panel/users.js";

let dir;
let usersPath;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "panel-users-"));
  usersPath = path.join(dir, "users.json");
  writeFileSync(usersPath, "[]\n", "utf8");
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("хранилище пользователей (файл)", () => {
  it("создаёт пользователя и выдаёт временный пароль, которым можно войти", async () => {
    const { email, tempPassword } = await createUser(usersPath, {
      email: "Owner@Example.ru",
      role: "owner",
    });
    expect(email).toBe("owner@example.ru");
    expect(tempPassword).toHaveLength(12);

    const user = findUserByEmail(usersPath, "owner@example.ru");
    expect(user.mustChangePassword).toBe(true);
    await expect(verifyPassword(tempPassword, user.passwordHash)).resolves.toBe(true);
  });

  it("не создаёт второго пользователя с той же почтой", async () => {
    await createUser(usersPath, { email: "a@example.ru", role: "editor" });
    await expect(createUser(usersPath, { email: "a@example.ru", role: "editor" })).rejects.toThrow();
  });

  it("отклоняет неизвестную роль", async () => {
    await expect(createUser(usersPath, { email: "a@example.ru", role: "admin" })).rejects.toThrow();
  });

  it("отклоняет почту без похожего на email формата", async () => {
    await expect(createUser(usersPath, { email: "не почта", role: "editor" })).rejects.toThrow(
      "неверную почту",
    );
    expect(listUsers(usersPath)).toHaveLength(0);
  });

  it("listUsers не отдаёт passwordHash", async () => {
    await createUser(usersPath, { email: "a@example.ru", role: "editor" });
    const [user] = listUsers(usersPath);
    expect(user.passwordHash).toBeUndefined();
    expect(user.email).toBe("a@example.ru");
  });

  it("resetPassword выдаёт новый временный пароль и снова требует смены", async () => {
    const created = await createUser(usersPath, { email: "a@example.ru", role: "editor" });
    await setPassword(usersPath, "a@example.ru", "мойновыйпароль1");

    const { tempPassword } = await resetPassword(usersPath, "a@example.ru");
    expect(tempPassword).not.toBe(created.tempPassword);

    const user = findUserByEmail(usersPath, "a@example.ru");
    expect(user.mustChangePassword).toBe(true);
    await expect(verifyPassword(tempPassword, user.passwordHash)).resolves.toBe(true);
  });

  it("setPassword снимает mustChangePassword", async () => {
    await createUser(usersPath, { email: "a@example.ru", role: "editor" });
    await setPassword(usersPath, "a@example.ru", "новыйпароль123");
    const user = findUserByEmail(usersPath, "a@example.ru");
    expect(user.mustChangePassword).toBe(false);
    await expect(verifyPassword("новыйпароль123", user.passwordHash)).resolves.toBe(true);
  });

  it("удаляет обычного пользователя", async () => {
    await createUser(usersPath, { email: "owner@example.ru", role: "owner" });
    await createUser(usersPath, { email: "editor@example.ru", role: "editor" });
    deleteUser(usersPath, "editor@example.ru");
    expect(listUsers(usersPath)).toHaveLength(1);
  });

  it("не даёт удалить последнего владельца", async () => {
    await createUser(usersPath, { email: "owner@example.ru", role: "owner" });
    expect(() => deleteUser(usersPath, "owner@example.ru")).toThrow("последнего владельца");
  });

  it("даёт удалить владельца, если владельцев несколько", async () => {
    await createUser(usersPath, { email: "owner1@example.ru", role: "owner" });
    await createUser(usersPath, { email: "owner2@example.ru", role: "owner" });
    expect(() => deleteUser(usersPath, "owner1@example.ru")).not.toThrow();
    expect(listUsers(usersPath)).toHaveLength(1);
  });
});
