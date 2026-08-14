import { getRequestSession } from "@/app/lib/auth";
import { getDashboardStats } from "@/app/lib/database";

export function GET(request: Request) {
  if (!getRequestSession(request)) return Response.json({ error: "Non autorisé" }, { status: 401 });
  return Response.json(getDashboardStats());
}
