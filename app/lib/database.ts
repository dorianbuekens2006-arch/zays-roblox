import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { defaultContent } from "./defaults";
import type { DashboardStats, MediaItem, SiteContent } from "./types";
import { validateContent } from "./validation";

interface ContentRow {
  draft_json: string;
  published_json: string;
  draft_updated_at: string;
  published_at: string | null;
}

interface SessionRow {
  token_hash: string;
  csrf: string;
  username: string;
  expires_at: string;
}

interface MediaRow {
  id: string;
  name: string;
  file_name: string;
  mime: string;
  size: number;
  created_at: string;
}

declare global {
  var __zaysDatabase: DatabaseSync | undefined;
}

export function getDataDirectory() {
  return path.resolve(process.env.DATA_DIR || path.join(process.cwd(), ".data"));
}

export function getUploadsDirectory() {
  const directory = path.join(getDataDirectory(), "uploads");
  mkdirSync(directory, { recursive: true });
  return directory;
}

function now() {
  return new Date().toISOString();
}

function getDb() {
  if (globalThis.__zaysDatabase) return globalThis.__zaysDatabase;

  const directory = getDataDirectory();
  mkdirSync(directory, { recursive: true });
  const database = new DatabaseSync(path.join(directory, "zays.sqlite"));
  database.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  database.exec(`
    CREATE TABLE IF NOT EXISTS site_content (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      draft_json TEXT NOT NULL,
      published_json TEXT NOT NULL,
      draft_updated_at TEXT NOT NULL,
      published_at TEXT
    );
    CREATE TABLE IF NOT EXISTS analytics (
      key TEXT PRIMARY KEY,
      value INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      csrf TEXT NOT NULL,
      username TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS login_attempts (
      key TEXT PRIMARY KEY,
      attempts INTEGER NOT NULL,
      reset_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      file_name TEXT NOT NULL UNIQUE,
      mime TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS activities_created_idx ON activities(created_at DESC);
  `);

  const initial = JSON.stringify(defaultContent);
  const timestamp = now();
  database
    .prepare("INSERT OR IGNORE INTO site_content (id, draft_json, published_json, draft_updated_at, published_at) VALUES (1, ?, ?, ?, ?)")
    .run(initial, initial, timestamp, timestamp);
  for (const key of ["visits", "game_clicks", "discord_clicks"]) {
    database.prepare("INSERT OR IGNORE INTO analytics (key, value) VALUES (?, 0)").run(key);
  }

  globalThis.__zaysDatabase = database;
  return database;
}

function contentRow() {
  return getDb().prepare("SELECT * FROM site_content WHERE id = 1").get() as unknown as ContentRow;
}

export function getPublishedContent(): SiteContent {
  return validateContent(JSON.parse(contentRow().published_json));
}

export function getDraftBundle() {
  const row = contentRow();
  return {
    content: validateContent(JSON.parse(row.draft_json)),
    draftUpdatedAt: row.draft_updated_at,
    publishedAt: row.published_at,
  };
}

function addActivity(action: string) {
  getDb().prepare("INSERT INTO activities (action, created_at) VALUES (?, ?)").run(action.slice(0, 180), now());
}

export function saveDraft(content: SiteContent) {
  const timestamp = now();
  getDb().prepare("UPDATE site_content SET draft_json = ?, draft_updated_at = ? WHERE id = 1").run(JSON.stringify(content), timestamp);
  addActivity("Contenu du site enregistré en brouillon");
  return timestamp;
}

export function publishDraft() {
  const timestamp = now();
  getDb().prepare("UPDATE site_content SET published_json = draft_json, published_at = ? WHERE id = 1").run(timestamp);
  addActivity("Nouvelle version du site publiée");
  return timestamp;
}

export function recordEvent(type: "visits" | "game_clicks" | "discord_clicks") {
  getDb().prepare("UPDATE analytics SET value = value + 1 WHERE key = ?").run(type);
}

export function getDashboardStats(): DashboardStats {
  const content = getDraftBundle().content;
  const rows = getDb().prepare("SELECT key, value FROM analytics").all() as unknown as Array<{ key: string; value: number }>;
  const counters = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const latest = getDb().prepare("SELECT id, action, created_at AS createdAt FROM activities ORDER BY id DESC LIMIT 8").all() as unknown as DashboardStats["latest"];
  return {
    games: content.games.length,
    scripts: content.scripts.length,
    links: content.links.length,
    bots: content.bots.length,
    visits: counters.visits || 0,
    gameClicks: counters.game_clicks || 0,
    discordClicks: counters.discord_clicks || 0,
    latest,
  };
}

export function createSession(token: string, csrf: string, username: string, expiresAt: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  getDb().prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now());
  getDb().prepare("INSERT INTO sessions (token_hash, csrf, username, expires_at) VALUES (?, ?, ?, ?)").run(tokenHash, csrf, username, expiresAt);
}

export function getSession(token: string): SessionRow | null {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const row = getDb().prepare("SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?").get(tokenHash, now()) as unknown as SessionRow | undefined;
  return row || null;
}

export function deleteSession(token: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
}

export function rateLimitState(key: string) {
  const db = getDb();
  const row = db.prepare("SELECT attempts, reset_at FROM login_attempts WHERE key = ?").get(key) as unknown as { attempts: number; reset_at: string } | undefined;
  if (!row) return { allowed: true, retryAfter: 0 };
  const remaining = Math.ceil((Date.parse(row.reset_at) - Date.now()) / 1000);
  if (remaining <= 0) {
    db.prepare("DELETE FROM login_attempts WHERE key = ?").run(key);
    return { allowed: true, retryAfter: 0 };
  }
  return { allowed: row.attempts < 5, retryAfter: remaining };
}

export function recordLoginFailure(key: string) {
  const resetAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  getDb().prepare(`
    INSERT INTO login_attempts (key, attempts, reset_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET
      attempts = CASE WHEN login_attempts.reset_at <= ? THEN 1 ELSE login_attempts.attempts + 1 END,
      reset_at = CASE WHEN login_attempts.reset_at <= ? THEN excluded.reset_at ELSE login_attempts.reset_at END
  `).run(key, resetAt, now(), now());
}

export function clearLoginFailures(key: string) {
  getDb().prepare("DELETE FROM login_attempts WHERE key = ?").run(key);
}

function mediaFromRow(row: MediaRow): MediaItem {
  return {
    id: row.id,
    name: row.name,
    fileName: row.file_name,
    mime: row.mime,
    size: row.size,
    url: `/api/media/${row.id}`,
    createdAt: row.created_at,
  };
}

export function listMedia(): MediaItem[] {
  const rows = getDb().prepare("SELECT * FROM media ORDER BY created_at DESC").all() as unknown as MediaRow[];
  return rows.map(mediaFromRow);
}

export function getMedia(id: string): MediaItem | null {
  const row = getDb().prepare("SELECT * FROM media WHERE id = ?").get(id) as unknown as MediaRow | undefined;
  return row ? mediaFromRow(row) : null;
}

export function addMedia(input: { name: string; fileName: string; mime: string; size: number }) {
  const row: MediaRow = { id: randomUUID(), name: input.name, file_name: input.fileName, mime: input.mime, size: input.size, created_at: now() };
  getDb().prepare("INSERT INTO media (id, name, file_name, mime, size, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(row.id, row.name, row.file_name, row.mime, row.size, row.created_at);
  addActivity(`Image ajoutée : ${row.name}`);
  return mediaFromRow(row);
}

export function renameMedia(id: string, name: string) {
  getDb().prepare("UPDATE media SET name = ? WHERE id = ?").run(name.slice(0, 100), id);
  addActivity(`Image renommée : ${name}`);
  return getMedia(id);
}

export function replaceMediaFile(id: string, input: { fileName: string; mime: string; size: number; name?: string }) {
  const current = getMedia(id);
  if (!current) return null;
  const name = (input.name || current.name).slice(0, 100);
  getDb().prepare("UPDATE media SET name = ?, file_name = ?, mime = ?, size = ? WHERE id = ?").run(name, input.fileName, input.mime, input.size, id);
  addActivity(`Image remplacée : ${name}`);
  return { previous: current, media: getMedia(id)! };
}

export function removeMedia(id: string) {
  const media = getMedia(id);
  if (!media) return null;
  getDb().prepare("DELETE FROM media WHERE id = ?").run(id);
  addActivity(`Image supprimée : ${media.name}`);
  return media;
}

export function filePathForMedia(media: MediaItem) {
  return path.join(getUploadsDirectory(), path.basename(media.fileName));
}
