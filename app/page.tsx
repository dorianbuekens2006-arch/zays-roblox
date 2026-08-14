import PublicSite from "./components/PublicSite";
import { getPublishedContent, recordEvent } from "./lib/database";

export const dynamic = "force-dynamic";

export default function Home() {
  recordEvent("visits");
  return <PublicSite content={getPublishedContent()} />;
}
