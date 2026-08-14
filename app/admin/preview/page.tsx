import { redirect } from "next/navigation";
import { getServerSession } from "@/app/lib/auth";
import { getDraftBundle } from "@/app/lib/database";
import PublicSite from "@/app/components/PublicSite";

export const dynamic = "force-dynamic";
export const metadata = { title: "Aperçu Zays", robots: { index: false, follow: false } };

export default async function AdminPreviewPage() {
  if (!(await getServerSession())) redirect("/admin/login");
  return <PublicSite content={getDraftBundle().content} />;
}
