import { randomUUID } from "node:crypto";
import { defaultContent } from "./defaults";
import type { BotStatus, ExecutorStatus, GameStatus, LinkCategory, ScriptCategory, SiteContent } from "./types";

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
const array = (value: unknown) => (Array.isArray(value) ? value : []);
const text = (value: unknown, fallback = "", max = 500) =>
  typeof value === "string" ? value.trim().slice(0, max) : fallback;
const bool = (value: unknown, fallback = true) => (typeof value === "boolean" ? value : fallback);
const oneOf = <T extends string>(value: unknown, choices: readonly T[], fallback: T) =>
  typeof value === "string" && choices.includes(value as T) ? (value as T) : fallback;

function url(value: unknown, fallback = "") {
  const candidate = text(value, fallback, 1200);
  if (!candidate) return "";
  if (candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" || (process.env.NODE_ENV !== "production" && parsed.protocol === "http:") ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
}

function target(value: unknown, fallback: string) {
  const candidate = text(value, fallback, 300);
  if (/^#[a-z0-9-]+$/i.test(candidate) || /^\/[a-z0-9/_?=&.-]*$/i.test(candidate)) return candidate;
  return url(candidate, fallback);
}

function color(value: unknown, fallback: string) {
  const candidate = text(value, fallback, 20);
  return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : fallback;
}

function date(value: unknown) {
  const candidate = text(value, new Date().toISOString().slice(0, 10), 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : new Date().toISOString().slice(0, 10);
}

function id(value: unknown) {
  const candidate = text(value, "", 80).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return candidate || randomUUID();
}

function normalizeLinks(value: unknown) {
  if (Array.isArray(value)) return value;

  // Migration de l'ancien format { discord, roblox, youtube, tiktok, x, other }
  const legacy = object(value);
  const definitions: Array<[string, string, LinkCategory, string, string]> = [
    ["discord", "Discord", "Discord", "DC", "Serveur Discord officiel de Zays."],
    ["roblox", "Roblox", "Roblox", "RB", "Profil ou groupe Roblox officiel."],
    ["youtube", "YouTube", "YouTube", "YT", "Chaîne YouTube officielle."],
    ["tiktok", "TikTok", "TikTok", "TK", "Compte TikTok officiel."],
    ["x", "X / Twitter", "X", "X", "Compte X officiel."],
    ["other", "Autre lien", "Autre", "↗", "Lien externe Zays."],
  ];
  return definitions.map(([key, name, category, image, description]) => {
    const href = text(legacy[key], "", 1200);
    return {
      id: key,
      name,
      image,
      description,
      category,
      url: href,
      updatedAt: new Date().toISOString().slice(0, 10),
      status: href ? "ACTIF" : "INACTIF",
      active: Boolean(href),
    };
  });
}

export function validateContent(value: unknown): SiteContent {
  const root = object(value);
  const home = object(root.home);
  const executor = object(root.executor);
  const settings = object(root.settings);

  const games = array(root.games).slice(0, 100).map((entry) => {
    const game = object(entry);
    return {
      id: id(game.id),
      name: text(game.name, "Nouveau jeu", 100),
      description: text(game.description, "", 1500),
      image: url(game.image, "/images/game-arena.webp"),
      banner: url(game.banner, url(game.image, "/images/game-arena.webp")),
      robloxUrl: url(game.robloxUrl),
      status: oneOf<GameStatus>(game.status, ["ONLINE", "BETA", "SOON", "OFFLINE"], "SOON"),
      players: text(game.players, "—", 80),
      buttonText: text(game.buttonText, "Jouer", 50),
      active: bool(game.active),
    };
  });

  const scripts = array(root.scripts).slice(0, 250).map((entry) => {
    const script = object(entry);
    return {
      id: id(script.id),
      name: text(script.name, "Nouveau script", 100),
      image: url(script.image) || text(script.image, "JS", 12),
      game: text(script.game, "Roblox Studio", 100),
      description: text(script.description, "", 1500),
      category: oneOf<ScriptCategory>(script.category, ["Utility", "Fun", "GUI", "Autres"], "Autres"),
      updatedAt: date(script.updatedAt),
      content: text(script.content, "", 20_000),
      status: oneOf(script.status, ["ACTIF", "INACTIF"] as const, "ACTIF"),
      active: bool(script.active),
    };
  });

  const links = normalizeLinks(root.links).slice(0, 250).map((entry) => {
    const link = object(entry);
    return {
      id: id(link.id),
      name: text(link.name, "Nouveau lien", 100),
      image: url(link.image) || text(link.image, "↗", 12),
      description: text(link.description, "", 1500),
      category: oneOf<LinkCategory>(link.category, ["Discord", "Roblox", "YouTube", "TikTok", "X", "Autre"], "Autre"),
      url: url(link.url),
      updatedAt: date(link.updatedAt),
      status: oneOf(link.status, ["ACTIF", "INACTIF"] as const, "INACTIF"),
      active: bool(link.active, false),
    };
  });

  const bots = array(root.bots).slice(0, 250).map((entry) => {
    const bot = object(entry);
    return {
      id: id(bot.id),
      name: text(bot.name, "Nouveau bot", 100),
      image: url(bot.image) || text(bot.image, "BOT", 12),
      platform: text(bot.platform, "Discord", 100),
      description: text(bot.description, "", 1500),
      url: url(bot.url),
      status: oneOf<BotStatus>(bot.status, ["ONLINE", "OFFLINE", "MAINTENANCE", "SOON"], "SOON"),
      buttonText: text(bot.buttonText, "Ouvrir le bot", 60),
      active: bool(bot.active, false),
    };
  });

  return {
    home: {
      eyebrow: text(home.eyebrow, defaultContent.home.eyebrow, 80),
      title: text(home.title, defaultContent.home.title, 80),
      subtitle: text(home.subtitle, defaultContent.home.subtitle, 180),
      description: text(home.description, defaultContent.home.description, 500),
      backgroundImage: url(home.backgroundImage, defaultContent.home.backgroundImage),
      buttons: array(home.buttons).slice(0, 3).map((entry, index) => {
        const button = object(entry);
        const fallback = defaultContent.home.buttons[index] || defaultContent.home.buttons[0];
        return { label: text(button.label, fallback.label, 50), target: target(button.target, fallback.target) };
      }),
    },
    games,
    executor: {
      name: text(executor.name, defaultContent.executor.name, 100),
      logo: text(executor.logo, defaultContent.executor.logo, 80),
      image: url(executor.image, defaultContent.executor.image),
      description: text(executor.description, defaultContent.executor.description, 1500),
      status: oneOf<ExecutorStatus>(executor.status, ["SOON", "ONLINE", "OFFLINE", "MAINTENANCE"], "SOON"),
      badgeText: text(executor.badgeText, "SOON", 40),
      version: text(executor.version, "0.1.0", 30),
      estimatedDate: text(executor.estimatedDate, "À annoncer", 80),
      buttonText: text(executor.buttonText, "COMING SOON", 60),
      buttonUrl: url(executor.buttonUrl),
      visible: bool(executor.visible),
    },
    scripts,
    links,
    bots,
    communityTitle: text(root.communityTitle, defaultContent.communityTitle, 120),
    communityText: text(root.communityText, defaultContent.communityText, 800),
    communityButton: text(root.communityButton, defaultContent.communityButton, 80),
    settings: {
      siteName: text(settings.siteName, "Zays", 80),
      logoText: text(settings.logoText, "ZAYS", 30),
      logoUrl: url(settings.logoUrl),
      faviconUrl: url(settings.faviconUrl, "/favicon.svg"),
      description: text(settings.description, defaultContent.settings.description, 400),
      primaryColor: color(settings.primaryColor, "#ff2435"),
      backgroundColor: color(settings.backgroundColor, "#050506"),
      textColor: color(settings.textColor, "#ffffff"),
      footerText: text(settings.footerText, defaultContent.settings.footerText, 300),
    },
  };
}

export function safeName(value: unknown, fallback = "image") {
  return text(value, fallback, 100).replace(/[<>]/g, "");
}
