import { getRequestSession, validateUnsafeRequest } from "@/app/lib/auth";
import { publishDraft } from "@/app/lib/database";

export function POST(request: Request) {
  const session = getRequestSession(request);
  if (!session) return Response.json({ error: "Non autorisé" }, { status: 401 });
  if (!validateUnsafeRequest(request, session.csrf)) return Response.json({ error: "Jeton de sécurité invalide" }, { status: 403 });
  return Response.json({ ok: true, publishedAt: publishDraft(), message: "Le site a été publié avec succès" });
}
