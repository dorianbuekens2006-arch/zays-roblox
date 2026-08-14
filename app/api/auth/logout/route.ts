import { NextResponse } from "next/server";
import { endRequestSession, getRequestSession, SESSION_COOKIE, validateUnsafeRequest } from "@/app/lib/auth";

export async function POST(request: Request) {
  const session = getRequestSession(request);
  if (!session || !validateUnsafeRequest(request, session.csrf)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  endRequestSession(request);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(0) });
  return response;
}
