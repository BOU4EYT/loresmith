import { NextRequest, NextResponse } from "next/server";
import { syncGameDetails, syncReviews, syncSteamSpyTags } from "@/lib/steam/sync";
 
// Edit this list as you grow — start small
const SEED_GAMES = [
  1145360,  // Hades
  814380,   // Sekiro: Shadows Die Twice
  1623730,  // Vampire Survivors
  2379780,  // Balatro
  1091500,  // Cyberpunk 2077
  736260,   // Baba Is You  (291550 is Brawlhalla)
  753640,   // Outer Wilds
  367520,   // Hollow Knight
  1086940,  // Baldur's Gate 3
  413150,   // Stardew Valley
  632470,   // Disco Elysium
  504230,   // Celeste
];
 
export async function POST(req: NextRequest) {
  // Verify cron secret — not a public endpoint
  if (req.headers.get("x-sync-secret") !== process.env.SYNC_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 
  const results = [];
  for (const appId of SEED_GAMES) {
    try {
      await syncGameDetails(appId);
      await syncReviews(appId);
      await syncSteamSpyTags(appId);
      await new Promise(r => setTimeout(r, 1200)); // ~1 req/sec for Steam
      results.push({ appId, status: "ok" });
    } catch (e) {
      results.push({ appId, status: "error", error: String(e) });
    }
  }
  return NextResponse.json({ synced: results.length, results });
}
