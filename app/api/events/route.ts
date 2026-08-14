import { recordEvent } from "@/app/lib/database";

const events = new Set(["game_clicks", "discord_clicks"]);

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { type?: string };
    if (!payload.type || !events.has(payload.type)) {
      return Response.json({ error: "Événement invalide" }, { status: 400 });
    }
    recordEvent(payload.type as "game_clicks" | "discord_clicks");
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Requête invalide" }, { status: 400 });
  }
}
