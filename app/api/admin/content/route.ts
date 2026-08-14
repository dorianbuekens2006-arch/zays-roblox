import { getDraftBundle, saveDraft } from "@/app/lib/database";
import { getRequestSession, validateUnsafeRequest } from "@/app/lib/auth";
import { validateContent } from "@/app/lib/validation";

export function GET(request: Request) {
  if (!getRequestSession(request)) return Response.json({ error: "Non autorisé" }, { status: 401 });
  return Response.json(getDraftBundle());
}

export async function PUT(request: Request) {
  const session = getRequestSession(request);
  if (!session) return Response.json({ error: "Non autorisé" }, { status: 401 });
  if (!validateUnsafeRequest(request, session.csrf)) return Response.json({ error: "Jeton de sécurité invalide" }, { status: 403 });
  try {
    const payload = await request.json();
    const content = validateContent(payload);
    const draftUpdatedAt = saveDraft(content);
    return Response.json({ ok: true, content, draftUpdatedAt, message: "Modifications enregistrées avec succès" });
  } catch {
    return Response.json({ error: "Le contenu envoyé est invalide." }, { status: 400 });
  }
}
