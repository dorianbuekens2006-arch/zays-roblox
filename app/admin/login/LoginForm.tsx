"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Icon } from "@/app/components/Icon";

export default function LoginForm({ configured }: { configured: boolean }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const result = await response.json() as { error?: string; redirect?: string };
      if (!response.ok) throw new Error(result.error || "Connexion impossible");
      window.location.href = result.redirect || "/admin";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connexion impossible");
    } finally { setLoading(false); }
  }

  return (
    <main className="login-page">
      <div className="login-ambient" /><div className="login-grid" />
      <Link className="brand login-brand" href="/"><span>ZAYS</span><i /></Link>
      <section className="login-card">
        <div className="login-shield"><Icon name="shield" /></div>
        <p className="overline">ESPACE SÉCURISÉ</p><h1>Panel Admin</h1><p className="login-intro">Connecte-toi pour administrer le contenu et publier les projets Zays.</p>
        {!configured && <div className="config-warning"><Icon name="info" /><span>Compte non configuré. Ajoute <code>ADMIN_PASSWORD_HASH</code> dans les variables Railway.</span></div>}
        <form onSubmit={submit}>
          <label><span>Identifiant</span><input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
          <label><span>Mot de passe</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <div className="login-error" role="alert">{error}</div>}
          <button className="button button-primary" disabled={loading || !configured}><Icon name="shield" />{loading ? "Vérification..." : "Connexion sécurisée"}<Icon name="arrow" /></button>
        </form>
        <div className="login-security"><Icon name="shield" /><span>Session chiffrée · Cookie HTTP-only · Connexion limitée</span></div>
      </section>
      <Link href="/" className="login-back">← Retour au site public</Link>
    </main>
  );
}
