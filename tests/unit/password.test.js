import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, generateTempPassword } from "../../panel/password.js";

describe("пароли", () => {
  it("верный пароль проходит проверку", async () => {
    const hash = await hashPassword("правильный-пароль-123");
    await expect(verifyPassword("правильный-пароль-123", hash)).resolves.toBe(true);
  });

  it("неверный пароль не проходит проверку", async () => {
    const hash = await hashPassword("правильный-пароль-123");
    await expect(verifyPassword("другой-пароль", hash)).resolves.toBe(false);
  });

  it("временный пароль — 12 символов без похожих друг на друга", () => {
    const password = generateTempPassword();
    expect(password).toHaveLength(12);
    expect(password).not.toMatch(/[0O1lI]/);
  });

  it("временные пароли не повторяются подряд", () => {
    const a = generateTempPassword();
    const b = generateTempPassword();
    expect(a).not.toBe(b);
  });
});
