import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession, passwordConfigured } from "@/app/lib/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Connexion Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getServerSession()) redirect("/admin");
  return <LoginForm configured={passwordConfigured()} />;
}
