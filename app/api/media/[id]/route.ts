import { readFile } from "node:fs/promises";
import { filePathForMedia, getMedia } from "@/app/lib/database";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  const { id } = await context.params;
  const media = getMedia(id);
  if (!media) return new Response("Introuvable", { status: 404 });
  try {
    const file = await readFile(filePathForMedia(media));
    return new Response(file, {
      headers: {
        "Content-Type": media.mime,
        "Content-Length": String(file.byteLength),
        "Cache-Control": "public, max-age=86400, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Introuvable", { status: 404 });
  }
}
