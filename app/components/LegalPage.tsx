import Link from "next/link";

export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="legal-page">
      <Link href="/" className="brand"><span>ZAYS</span><i /></Link>
      <article><p className="overline">INFORMATIONS LÉGALES</p><h1>{title}</h1>{children}<Link href="/" className="button button-primary">Retour au site</Link></article>
    </main>
  );
}
