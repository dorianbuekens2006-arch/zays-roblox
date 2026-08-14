import "server-only";

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createSession, deleteSession, getSession } from "./database";

export const SESSION_COOKIE = "zays_admin_session";

function cookieValue(header: string | null, name: string) {
  if (!header) return null;
  const entry = header.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
}

export function adminUsername() {
  return (process.env.ADMIN_USERNAME || "admin").trim();
}

export function passwordConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD_HASH?.trim());
}

export function verifyAdminCredentials(username: string, password: string) {
  if (username !== adminUsername()) return false;
  const encoded = process.env.ADMIN_PASSWORD_HASH || "";
  const [algorithm, saltHex, hashHex] = encoded.split("$");
  if (algorithm !== "scrypt" || !saltHex || !hashHex) return false;
  try {
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function newSession(username: string) {
  const token = randomBytes(48).toString("base64url");
  const csrf = randomBytes(32).toString("base64url");
  const hours = Math.min(Math.max(Number(process.env.SESSION_TTL_HOURS) || 8, 1), 72);
  const expiresAt = new Date(Date.now() + hours * 3600_000);
  createSession(token, csrf, username, expiresAt.toISOString());
  return { token, csrf, expiresAt };
}

export async function getServerSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token ? getSession(token) : null;
}

export function getRequestSession(request: Request) {
  const token = cookieValue(request.headers.get("cookie"), SESSION_COOKIE);
  return token ? getSession(token) : null;
}

export function validateUnsafeRequest(request: Request, csrf: string) {
  if (request.headers.get("x-csrf-token") !== csrf) return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export function endRequestSession(request: Request) {
  const token = cookieValue(request.headers.get("cookie"), SESSION_COOKIE);
  if (token) deleteSession(token);
}

export function clientRateKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(address).digest("hex");
}

export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    expires,
  };
}
