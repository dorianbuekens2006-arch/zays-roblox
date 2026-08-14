import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getPublishedContent } from "./lib/database";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export function generateMetadata(): Metadata {
  const { settings } = getPublishedContent();
  return {
    title: { default: `${settings.siteName} — Projets Roblox`, template: `%s | ${settings.siteName}` },
    description: settings.description,
    icons: { icon: settings.faviconUrl || "/favicon.svg", shortcut: settings.faviconUrl || "/favicon.svg" },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = { themeColor: "#050506", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
