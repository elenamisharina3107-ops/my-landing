import { createHmac, timingSafeEqual } from "node:crypto";
import { serialize, parse } from "cookie";

export const SESSION_COOKIE = "panel_session";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 дней — «не разлогинивает без причины» (план, Этап 2)

function base64url(input) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function sign(payloadBase64, secret) {
  return createHmac("sha256", secret).update(payloadBase64).digest("base64url");
}

/**
 * Подписанный сессионный токен для наших страниц (/account, /users, /history) —
 * не имеет отношения к GitHub-токену бота, который отдельно уходит панели Sveltia.
 */
export function createSessionToken({ email, role }, secret, maxAgeSeconds = MAX_AGE_SECONDS) {
  const payload = base64url(JSON.stringify({ email, role, exp: Date.now() + maxAgeSeconds * 1000 }));
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token, secret) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  const expected = sign(payload, secret);

  const a = Buffer.from(signature ?? "");
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof data.exp !== "number" || data.exp < Date.now()) return null;

  return { email: data.email, role: data.role };
}

export function setSessionCookie(res, token) {
  appendCookie(res, serialize(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin/_panel",
    maxAge: MAX_AGE_SECONDS,
  }));
}

export function clearSessionCookie(res) {
  appendCookie(res, serialize(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin/_panel",
    maxAge: 0,
  }));
}

function appendCookie(res, cookieStr) {
  const existing = res.getHeader("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", cookieStr);
  } else {
    res.setHeader("Set-Cookie", Array.isArray(existing) ? [...existing, cookieStr] : [existing, cookieStr]);
  }
}

/** Читает и проверяет сессию текущего запроса; null — если её нет или она невалидна. */
export function getSession(req, secret) {
  const cookies = parse(req.headers.cookie || "");
  return verifySessionToken(cookies[SESSION_COOKIE], secret);
}
