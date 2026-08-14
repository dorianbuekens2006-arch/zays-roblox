"use client";
/* eslint-disable @next/next/no-img-element -- URLs are admin-managed and may target the local media API. */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import type { ScriptCategory, ScriptItem, SiteContent } from "../lib/types";

function event(type: "game_clicks" | "discord_clicks") {
  void fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }), keepalive: true });
}

function hexToRgb(hex: string) {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  return match ? `${parseInt(match[1], 16)}, ${parseInt(match[2], 16)}, ${parseInt(match[3], 16)}` : "255, 36, 53";
}

function SmartImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`smart-image ${loaded ? "is-loaded" : ""}`}>
      <div className="image-skeleton" />
      <img src={src} alt={alt} onLoad={() => setLoaded(true)} />
    </div>
  );
}

function Status({ value }: { value: string }) {
  return <span className={`status status-${value.toLowerCase()}`}><i />{value}</span>;
}

export default function PublicSite({ content }: { content: SiteContent }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"Tous" | ScriptCategory>("Tous");
  const [selectedScript, setSelectedScript] = useState<ScriptItem | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible"));
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setSelectedScript(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const scripts = useMemo(() => {
    const query = search.toLowerCase().trim();
    return content.scripts.filter((script) => script.active)
      .filter((script) => category === "Tous" || script.category === category)
      .filter((script) => !query || `${script.name} ${script.game} ${script.description}`.toLowerCase().includes(query));
  }, [content.scripts, search, category]);

  async function copyScript(script: ScriptItem) {
    await navigator.clipboard.writeText(script.content);
    setCopied(script.id);
    window.setTimeout(() => setCopied(null), 1800);
  }

  const style = {
    "--brand": content.settings.primaryColor,
    "--brand-rgb": hexToRgb(content.settings.primaryColor),
    "--page-bg": content.settings.backgroundColor,
    "--page-text": content.settings.textColor,
  } as CSSProperties;
  const socialLinks = [
    ["Roblox", content.links.roblox], ["YouTube", content.links.youtube], ["TikTok", content.links.tiktok], ["X", content.links.x], ["Autre", content.links.other],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <div className="public-shell" style={style}>
      <header className="navbar">
        <a className="brand" href="#accueil" aria-label="Zays — Accueil">
          {content.settings.logoUrl ? <img src={content.settings.logoUrl} alt="" /> : <span>{content.settings.logoText}</span>}
          <i />
        </a>
        <nav className={menuOpen ? "nav-links is-open" : "nav-links"} aria-label="Navigation principale">
          <a href="#accueil" onClick={() => setMenuOpen(false)}>Accueil</a>
          <a href="#jeux" onClick={() => setMenuOpen(false)}>Jeux</a>
          <a href="#executor" onClick={() => setMenuOpen(false)}>Executor</a>
          <a href="#scripts" onClick={() => setMenuOpen(false)}>Scripts</a>
          <a href="#discord" onClick={() => setMenuOpen(false)}>Lien</a>
        </nav>
        <div className="nav-actions">
          <Link href="/admin" className="admin-entry" aria-label="Ouvrir le panel admin"><Icon name="shield" /></Link>
          <button className="menu-toggle" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label="Menu">
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
        </div>
      </header>

      <main>
        <section id="accueil" className="hero" style={{ backgroundImage: `url(${content.home.backgroundImage})` }}>
          <div className="hero-grid" />
          <div className="orb orb-one" /><div className="orb orb-two" />
          <div className="particles" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div>
          <div className="hero-content">
            <div className="hero-kicker"><span />{content.home.eyebrow}</div>
            <h1 aria-label={content.home.title}>{content.home.title.split("").map((letter, index) => <span key={`${letter}-${index}`} style={{ animationDelay: `${index * 70}ms` }}>{letter}</span>)}</h1>
            <p className="hero-subtitle">{content.home.subtitle}</p>
            <p className="hero-description">{content.home.description}</p>
            <div className="hero-actions">
              {content.home.buttons.map((button, index) => (
                <a key={`${button.label}-${index}`} className={index === 0 ? "button button-primary" : "button button-ghost"} href={button.target}>
                  {index === 0 && <Icon name="play" />}{button.label}<Icon name="arrow" />
                </a>
              ))}
            </div>
            <div className="hero-meta"><span><b>03</b> PROJETS</span><i /><span><b>24/7</b> CRÉATIVITÉ</span><i /><span><b>100%</b> ZAYS</span></div>
          </div>
          <a className="scroll-cue" href="#jeux"><span>SCROLL</span><i /></a>
        </section>

        <section id="jeux" className="section games-section">
          <div className="section-heading reveal">
            <div><p className="overline">EXPÉRIENCES</p><h2>Mes jeux <em>Roblox</em></h2></div>
            <p>Des univers originaux, pensés pour être explorés, rejoués et partagés.</p>
          </div>
          <div className="games-grid">
            {content.games.filter((game) => game.active).map((game, index) => (
              <article className="game-card reveal" key={game.id} style={{ transitionDelay: `${index * 80}ms` }}>
                <div className="game-visual"><SmartImage src={game.image} alt={`Miniature de ${game.name}`} /><div className="card-index">0{index + 1}</div><Status value={game.status} /></div>
                <div className="game-body">
                  <div className="game-title-row"><h3>{game.name}</h3><Icon name="gamepad" /></div>
                  <p>{game.description}</p>
                  <div className="game-stats"><Icon name="users" /><span>{game.players}</span></div>
                  <div className="card-actions">
                    {game.robloxUrl ? (
                      <a className="button button-primary button-small" href={game.robloxUrl} target="_blank" rel="noreferrer" onClick={() => event("game_clicks")}><Icon name="play" />{game.buttonText}</a>
                    ) : <button className="button button-primary button-small" disabled title="Lien à configurer dans le panel admin"><Icon name="play" />{game.buttonText}</button>}
                    <button className="button button-quiet button-small" onClick={() => document.getElementById("discord")?.scrollIntoView({ behavior: "smooth" })}><Icon name="info" />Plus d’infos</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {content.executor.visible && (
          <section id="executor" className="section executor-wrap">
            <div className="executor-card reveal" style={{ backgroundImage: `url(${content.executor.image})` }}>
              <div className="executor-noise" /><div className="executor-scan" />
              <div className="executor-icon">{content.executor.logo}<i /></div>
              <div className="executor-copy">
                <p className="overline">NOUVEAU PROJET // {content.executor.version}</p>
                <h2>{content.executor.name}</h2>
                <p>{content.executor.description}</p>
                <div className="executor-meta"><Status value={content.executor.status} /><span>ESTIMATION&nbsp;: {content.executor.estimatedDate}</span></div>
              </div>
              <div className="executor-cta">
                <div className="soon-badge"><span>{content.executor.badgeText}</span></div>
                {content.executor.status === "SOON" || !content.executor.buttonUrl ? (
                  <button className="button button-coming" disabled>{content.executor.buttonText}</button>
                ) : (
                  <a className="button button-primary" href={content.executor.buttonUrl} target="_blank" rel="noreferrer">{content.executor.buttonText}<Icon name="external" /></a>
                )}
              </div>
            </div>
          </section>
        )}

        <section id="scripts" className="section scripts-section">
          <div className="section-heading reveal">
            <div><p className="overline">BIBLIOTHÈQUE</p><h2>Scripts <em>Zays</em></h2></div>
            <p>Des ressources propres et documentées pour tes projets et prototypes.</p>
          </div>
          <div className="script-toolbar reveal">
            <label className="search-box"><Icon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un script..." aria-label="Rechercher un script" /></label>
            <div className="filter-list" role="group" aria-label="Catégories">
              {(["Tous", "Utility", "Fun", "GUI", "Autres"] as const).map((item) => <button key={item} className={category === item ? "is-active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
            </div>
          </div>
          <div className="scripts-grid" key={`${category}-${search}`}>
            {scripts.map((script, index) => (
              <article className="script-card result-enter" key={script.id} style={{ animationDelay: `${index * 55}ms` }}>
                <div className="script-top"><div className="script-icon">{script.image.startsWith("/") || script.image.startsWith("http") ? <img src={script.image} alt="" /> : script.image}</div><Status value={script.status} /></div>
                <div><span className="script-category">{script.category}</span><h3>{script.name}</h3><p>{script.description}</p></div>
                <div className="script-details"><span>COMPATIBLE</span><b>{script.game}</b><span>MISE À JOUR</span><b>{new Date(script.updatedAt).toLocaleDateString("fr-FR")}</b></div>
                <div className="card-actions">
                  <button className="button button-quiet button-small" onClick={() => setSelectedScript(script)}><Icon name="eye" />Voir</button>
                  <button className="button button-primary button-small" onClick={() => copyScript(script)}><Icon name="copy" />{copied === script.id ? "Copié !" : "Copier"}</button>
                </div>
              </article>
            ))}
            {!scripts.length && <div className="empty-result"><Icon name="search" /><h3>Aucun résultat</h3><p>Essaie un autre mot-clé ou une autre catégorie.</p></div>}
          </div>
          <p className="compliance-note reveal"><Icon name="shield" /> Les scripts publiés doivent respecter les règles et conditions d’utilisation des plateformes concernées.</p>
        </section>

        <section id="discord" className="section community-section">
          <div className="community-card reveal">
            <div className="community-mark"><Icon name="discord" /></div>
            <div><p className="overline">COMMUNAUTÉ ZAYS</p><h2>{content.communityTitle}</h2><p>{content.communityText}</p></div>
            {content.links.discord ? (
              <a className="button button-discord" href={content.links.discord} target="_blank" rel="noreferrer" onClick={() => event("discord_clicks")}><Icon name="discord" />{content.communityButton}<Icon name="arrow" /></a>
            ) : <button className="button button-discord" disabled title="Ajoute le lien Discord dans le panel admin"><Icon name="discord" />{content.communityButton}</button>}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-main"><div><a className="brand footer-brand" href="#accueil"><span>{content.settings.logoText}</span><i /></a><p>{content.settings.description}</p>{socialLinks.length > 0 && <div className="footer-socials">{socialLinks.map(([label, href]) => <a href={href} target="_blank" rel="noreferrer" key={label}>{label}</a>)}</div>}</div><nav><a href="#accueil">Accueil</a><a href="#jeux">Jeux</a><a href="#scripts">Scripts</a><a href="#discord">Discord</a></nav><nav><Link href="/conditions">Conditions d’utilisation</Link><Link href="/confidentialite">Politique de confidentialité</Link></nav></div>
        <div className="footer-bottom"><span>{content.settings.footerText}</span><span>Zays n’est pas affilié, associé ou sponsorisé par Roblox Corporation.</span></div>
      </footer>

      {selectedScript && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && setSelectedScript(null)}>
          <div className="script-modal" role="dialog" aria-modal="true" aria-label={`Script ${selectedScript.name}`}>
            <button className="modal-close" onClick={() => setSelectedScript(null)} aria-label="Fermer"><Icon name="close" /></button>
            <p className="overline">{selectedScript.category}{" // "}{selectedScript.game}</p><h2>{selectedScript.name}</h2><p>{selectedScript.description}</p>
            <pre><code>{selectedScript.content}</code></pre>
            <button className="button button-primary" onClick={() => copyScript(selectedScript)}><Icon name="copy" />{copied === selectedScript.id ? "Copié dans le presse-papiers" : "Copier le script"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
