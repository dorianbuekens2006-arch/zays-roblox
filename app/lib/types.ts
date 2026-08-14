export type GameStatus = "ONLINE" | "BETA" | "SOON" | "OFFLINE";
export type ExecutorStatus = "SOON" | "ONLINE" | "OFFLINE" | "MAINTENANCE";
export type ScriptCategory = "Utility" | "Fun" | "GUI" | "Autres";
export type LinkCategory = "Discord" | "Roblox" | "YouTube" | "TikTok" | "X" | "Autre";
export type BotStatus = "ONLINE" | "OFFLINE" | "MAINTENANCE" | "SOON";

export interface ActionButton {
  label: string;
  target: string;
}

export interface HomeContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  backgroundImage: string;
  buttons: ActionButton[];
}

export interface GameItem {
  id: string;
  name: string;
  description: string;
  image: string;
  banner: string;
  robloxUrl: string;
  status: GameStatus;
  players: string;
  buttonText: string;
  active: boolean;
}

export interface ExecutorContent {
  name: string;
  logo: string;
  image: string;
  description: string;
  status: ExecutorStatus;
  badgeText: string;
  version: string;
  estimatedDate: string;
  buttonText: string;
  buttonUrl: string;
  visible: boolean;
}

export interface ScriptItem {
  id: string;
  name: string;
  image: string;
  game: string;
  description: string;
  category: ScriptCategory;
  updatedAt: string;
  content: string;
  status: "ACTIF" | "INACTIF";
  active: boolean;
}

export interface LinkItem {
  id: string;
  name: string;
  image: string;
  description: string;
  category: LinkCategory;
  url: string;
  updatedAt: string;
  status: "ACTIF" | "INACTIF";
  active: boolean;
}

export interface BotItem {
  id: string;
  name: string;
  image: string;
  platform: string;
  description: string;
  url: string;
  status: BotStatus;
  buttonText: string;
  active: boolean;
}

export interface SiteSettings {
  siteName: string;
  logoText: string;
  logoUrl: string;
  faviconUrl: string;
  description: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  footerText: string;
}

export interface SiteContent {
  home: HomeContent;
  games: GameItem[];
  executor: ExecutorContent;
  scripts: ScriptItem[];
  links: LinkItem[];
  bots: BotItem[];
  communityTitle: string;
  communityText: string;
  communityButton: string;
  settings: SiteSettings;
}

export interface MediaItem {
  id: string;
  name: string;
  fileName: string;
  mime: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface ActivityItem {
  id: number;
  action: string;
  createdAt: string;
}

export interface DashboardStats {
  games: number;
  scripts: number;
  links: number;
  bots: number;
  visits: number;
  gameClicks: number;
  discordClicks: number;
  latest: ActivityItem[];
}

export interface AdminBootstrap {
  content: SiteContent;
  publishedAt: string | null;
  draftUpdatedAt: string;
  csrfToken: string;
  stats: DashboardStats;
  media: MediaItem[];
  username: string;
}
