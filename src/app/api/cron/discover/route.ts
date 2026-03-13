export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import {
  fetchTop100Recent,
  fetchTop100Forever,
  fetchNewReleases,
  enqueueGames,
} from "@/lib/steam/sync";

export async function GET(req: NextRequest) {
  // Vercel cron sends Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  const results: Record<string, number> = {};

  const [recent, forever, newRel] = await Promise.all([
    fetchTop100Recent(),
    fetchTop100Forever(),
    fetchNewReleases(),
  ]);

  results.top100_2w       = await enqueueGames(recent,  "top100_2w",       7);
  results.top100_forever  = await enqueueGames(forever, "top100_forever",  14);
  results.new_releases    = await enqueueGames(newRel,  "new_releases",    3);

  const totalQueued = Object.values(results).reduce((a, b) => a + b, 0);

  // Log the run
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  await sb.from("sync_log").insert({
    source:      "discover",
    queued:      totalQueued,
    synced:      0,
    errors:      0,
    duration_ms: Date.now() - start,
    details:     results,
  });

  return NextResponse.json({
    ok:      true,
    queued:  totalQueued,
    sources: results,
    ms:      Date.now() - start,
  });
}
