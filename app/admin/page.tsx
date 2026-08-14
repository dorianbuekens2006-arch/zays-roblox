import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { adminUsername, getServerSession } from "@/app/lib/auth";
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

  try {
    const [bundle, stats, media] = await Promise.all([
      getDraftBundle(),
      getDashboardStats(),
      listMedia(),
    ]);

    return (
      <AdminDashboard
        initial={{
          ...bundle,
          csrfToken: session.csrf ?? "",
          stats,
          media: Array.isArray(media) ? media : [],
          username: adminUsername() || "Admin",
        }}
      />
    );
  } catch (error) {
    console.error("[ADMIN] Impossible de charger le panel :", error);

    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "32px",
          background: "#0b0b0b",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <section
          style={{
            width: "min(640px, 100%)",
            padding: "28px",
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: "16px",
            background: "#141414",
          }}
        >
          <h1 style={{ marginTop: 0 }}>Erreur de chargement du panel admin</h1>
          <p>
            Le panel n’a pas pu récupérer ses données. Regarde le terminal où
            tourne Next.js : l’erreur complète est affichée avec le préfixe
            <strong> [ADMIN]</strong>.
          </p>
          <a href="/admin" style={{ color: "#fff" }}>
            Réessayer
          </a>
        </section>
      </main>
    );
  }
}
