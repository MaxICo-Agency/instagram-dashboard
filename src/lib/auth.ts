import crypto from "node:crypto";

const SECRET = process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
export const SESSION_COOKIE = "ig_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function createToken(user: string): string {
  const payload = `${user}.${Date.now()}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyToken(token?: string): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const idx = decoded.lastIndexOf(".");
    if (idx < 0) return false;
    const payload = decoded.slice(0, idx);
    const sig = decoded.slice(idx + 1);
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    if (!crypto.timingSafeEqual(a, b)) return false;
    const ts = Number(payload.slice(payload.lastIndexOf(".") + 1));
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < MAX_AGE * 1000;
  } catch {
    return false;
  }
}

export function checkCredentials(user: string, pass: string): boolean {
  const U = process.env.ADMIN_USERNAME || "admin";
  const P = process.env.ADMIN_PASSWORD || "";
  return Boolean(P) && user === U && pass === P;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};
