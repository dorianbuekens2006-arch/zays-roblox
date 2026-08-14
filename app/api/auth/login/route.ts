import { NextResponse } from "next/server";
import { adminUsername, clientRateKey, newSession, passwordConfigured, SESSION_COOKIE, sessionCookieOptions, verifyAdminCredentials } from "@/app/lib/auth";
import { clearLoginFailures, rateLimitState, recordLoginFailure } from "@/app/lib/database";

export async function POST(request: Request) {
  const key = clientRateKey(request);
  const limit = rateLimitState(key);
  if (!limit.allowed) {
    return NextResponse.json({ error: `Trop de tentatives. Réessaie dans ${limit.retryAfter} secondes.` }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  }
  if (!passwordConfigured()) {
    return NextResponse.json({ error: "Le compte administrateur n’est pas encore configuré." }, { status: 503 });
  }

  try {
    const payload = (await request.json()) as { username?: string; password?: string };
    const username = (payload.username || "").trim().slice(0, 100);
    const password = (payload.password || "").slice(0, 500);
    if (!verifyAdminCredentials(username, password)) {
      recordLoginFailure(key);
      return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
    }

    clearLoginFailures(key);
    const session = newSession(adminUsername());
    const response = NextResponse.json({ ok: true, redirect: "/admin" });
    response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
    return response;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
}
