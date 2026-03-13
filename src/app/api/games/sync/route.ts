export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { enqueueGames, processQueue } from "@/lib/steam/sync";

// Manual trigger — seeds the queue with a starter set and processes immediately.
// POST /api/games/sync  with header x-sync-secret: <SYNC_SECRET>
// Optional body: { "appIds": [1145360, 814380, ...] }
export async function POST(req: NextRequest) {
  if (req.headers.get("x-sync-secret") !== process.env.SYNC_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let appIds: number[] = [];

  try {
    const body = await req.json();
    if (Array.isArray(body?.appIds)) appIds = body.appIds.map(Number);
  } catch { /* no body is fine */ }

  // Default starter set if no IDs supplied
  if (appIds.length === 0) {
    appIds = [
      1145360, // Hades
      814380,  // Sekiro
      1623730, // Vampire Survivors
      2379780, // Balatro
      1091500, // Cyberpunk 2077
      736260,  // Baba Is You
      753640,  // Outer Wilds
      367520,  // Hollow Knight
      1086940, // Baldur's Gate 3
      413150,  // Stardew Valley
      632470,  // Disco Elysium
      504230,  // Celeste
      1245620, // Elden Ring
      553420,  // Tunic
      1794680, // Vampire Survivors (already above, deduped)
    ];
  }

  const queued  = await enqueueGames(appIds, "manual", 0); // freshness=0 forces re-sync
  const results = await processQueue(appIds.length);

  return NextResponse.json({ queued, ...results });
}
