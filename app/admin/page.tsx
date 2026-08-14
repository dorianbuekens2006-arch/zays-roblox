import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  adminUsername,
  getServerSession,
} from "@/app/lib/auth";

import {
  getDashboardStats,
  getDraftBundle,
  listMedia,
} from "@/app/lib/database";

import AdminDashboard from "./AdminDashboard";

export const metadata: Metadata = {
  title: "Panel Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/admin/login");
  }

  const [bundle, stats, media] = await Promise.all([
    getDraftBundle(),
    getDashboardStats(),
    listMedia(),
  ]);

  return (
    <AdminDashboard
      initial={{
        ...bundle,
        csrfToken: session.csrf,
        stats,
        media,
        username: adminUsername(),
      }}
    />
  );
}
