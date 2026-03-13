export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { processQueue }              from "@/lib/steam/sync";

// Vercel cron functions time out at 300s on Pro, 10s on Hobby.
// We process 40 games per run (~32s at 800ms/game) to stay safe.
const BATCH_SIZE = 40;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start  = Date.now();
  const result = await processQueue(BATCH_SIZE);

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  await sb.from("sync_log").insert({
    source:      "process_queue",
    queued:      0,
    synced:      result.synced,
    errors:      result.errors,
    duration_ms: Date.now() - start,
    details:     { errorDetails: result.errorDetails.slice(0, 20) },
  });

  return NextResponse.json({
    ok:     true,
    synced: result.synced,
    errors: result.errors,
    ms:     Date.now() - start,
  });
}
