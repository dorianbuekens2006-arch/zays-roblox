import { getRequestSession, validateUnsafeRequest } from "@/app/lib/auth";
import { addMedia, listMedia } from "@/app/lib/database";
import { maxUploadBytes, storeValidatedImage } from "@/app/lib/uploads";
import { safeName } from "@/app/lib/validation";

export function GET(request: Request) {
  if (!getRequestSession(request)) return Response.json({ error: "Non autorisé" }, { status: 401 });
  return Response.json({ media: listMedia() });
}

export async function POST(request: Request) {
  const session = getRequestSession(request);
  if (!session) return Response.json({ error: "Non autorisé" }, { status: 401 });
  if (!validateUnsafeRequest(request, session.csrf)) return Response.json({ error: "Jeton de sécurité invalide" }, { status: 403 });
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > maxUploadBytes() + 200_000) return Response.json({ error: "Fichier trop volumineux" }, { status: 413 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Image requise" }, { status: 400 });
    const stored = await storeValidatedImage(file);
    const media = addMedia({ name: safeName(form.get("name"), file.name.replace(/\.[^.]+$/, "")), ...stored });
    return Response.json({ media }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message === "SIZE" ? "Image trop volumineuse" : "Format invalide. Utilise PNG, JPG, JPEG ou WEBP.";
    return Response.json({ error: message }, { status: 400 });
  }
}
