import { unlink } from "node:fs/promises";
import { getRequestSession, validateUnsafeRequest } from "@/app/lib/auth";
import { filePathForMedia, getMedia, removeMedia, renameMedia, replaceMediaFile } from "@/app/lib/database";
import { maxUploadBytes, storeValidatedImage } from "@/app/lib/uploads";
import { safeName } from "@/app/lib/validation";

type Context = { params: Promise<{ id: string }> };

function authorized(request: Request) {
  const session = getRequestSession(request);
  if (!session) return { error: Response.json({ error: "Non autorisé" }, { status: 401 }) };
  if (!validateUnsafeRequest(request, session.csrf)) return { error: Response.json({ error: "Jeton de sécurité invalide" }, { status: 403 }) };
  return { session };
}

export async function PATCH(request: Request, context: Context) {
  const auth = authorized(request);
  if (auth.error) return auth.error;
  const { id } = await context.params;
  try {
    const payload = (await request.json()) as { name?: string };
    const media = renameMedia(id, safeName(payload.name));
    return media ? Response.json({ media }) : Response.json({ error: "Image introuvable" }, { status: 404 });
  } catch {
    return Response.json({ error: "Requête invalide" }, { status: 400 });
  }
}

export async function PUT(request: Request, context: Context) {
  const auth = authorized(request);
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const current = getMedia(id);
  if (!current) return Response.json({ error: "Image introuvable" }, { status: 404 });
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > maxUploadBytes() + 200_000) return Response.json({ error: "Fichier trop volumineux" }, { status: 413 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Image requise" }, { status: 400 });
    const stored = await storeValidatedImage(file);
    const result = replaceMediaFile(id, { ...stored, name: safeName(form.get("name"), current.name) });
    if (result) await unlink(filePathForMedia(result.previous)).catch(() => undefined);
    return Response.json({ media: result?.media });
  } catch (error) {
    const message = error instanceof Error && error.message === "SIZE" ? "Image trop volumineuse" : "Format invalide. Utilise PNG, JPG, JPEG ou WEBP.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: Context) {
  const auth = authorized(request);
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const media = removeMedia(id);
  if (!media) return Response.json({ error: "Image introuvable" }, { status: 404 });
  await unlink(filePathForMedia(media)).catch(() => undefined);
  return Response.json({ ok: true });
}
