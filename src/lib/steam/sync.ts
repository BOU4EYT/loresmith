import { createClient } from "@supabase/supabase-js";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Steam Store API ────────────────────────────────────────────────────────
export async function syncGameDetails(appId: number): Promise<boolean> {
  const res = await fetch(
    `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&l=en`,
    { cache: "no-store" }
  );
  if (!res.ok) return false;
  const json = await res.json();
  const d = json?.[appId]?.data;
  if (!d || d.type !== "game") return false;

  const slug =
    d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") +
    "-" + appId;

  let releaseDate: string | null = null;
  if (d.release_date?.date) {
    try { releaseDate = new Date(d.release_date.date).toISOString(); } catch { /* skip */ }
  }

  const sb = getClient();
  await sb.from("games").upsert({
    id:             appId,
    slug,
    title:          d.name,
    studio:         d.developers?.[0] ?? null,
    publisher:      d.publishers?.[0] ?? null,
    short_desc:     d.short_description ?? null,
    description:    d.detailed_description ?? null,
    release_date:   releaseDate,
    is_free:        d.is_free ?? false,
    price_usd:      d.price_overview ? d.price_overview.final / 100 : null,
    steam_url:      `https://store.steampowered.com/app/${appId}`,
    header_image:   d.header_image ?? null,
    updated_at:     new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  }, { onConflict: "id" });

  return true;
}

export async function syncReviews(appId: number): Promise<void> {
  const res = await fetch(
    `https://store.steampowered.com/appreviews/${appId}?json=1&language=all&purchase_type=all`,
    { cache: "no-store" }
  );
  if (!res.ok) return;
  const json = await res.json();
  const s = json?.query_summary;
  if (!s) return;
  const sb = getClient();
  await sb.from("games").update({
    steam_positive: s.total_positive ?? 0,
    steam_negative: s.total_negative ?? 0,
    updated_at: new Date().toISOString(),
  }).eq("id", appId);
}

export async function syncSteamSpyTags(appId: number): Promise<void> {
  const res = await fetch(
    `https://steamspy.com/api.php?request=appdetails&appid=${appId}`,
    { cache: "no-store" }
  );
  if (!res.ok) return;
  const data = await res.json();
  const tags: Record<string, number> = data?.tags ?? {};
  const sb = getClient();

  for (const [label, votes] of Object.entries(tags)) {
    const { data: tag } = await sb
      .from("steam_tags")
      .upsert({ label }, { onConflict: "label" })
      .select("id")
      .single();
    if (tag) {
      await sb.from("game_steam_tags").upsert(
        { game_id: appId, tag_id: (tag as { id: number }).id, vote_count: votes },
        { onConflict: "game_id,tag_id" }
      );
    }
  }
  await sb.rpc("apply_steam_tag_mechanics", { p_game_id: appId });
}

export async function syncGame(appId: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const synced = await syncGameDetails(appId);
    if (!synced) return { ok: false, error: "not a game or no data" };
    await sleep(800);
    await syncReviews(appId);
    await sleep(800);
    await syncSteamSpyTags(appId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ── Discovery sources ──────────────────────────────────────────────────────
export async function fetchTop100Recent(): Promise<number[]> {
  const res = await fetch("https://steamspy.com/api.php?request=top100in2weeks", { cache: "no-store" });
  if (!res.ok) return [];
  return Object.keys(await res.json()).map(Number).filter(Boolean);
}

export async function fetchTop100Forever(): Promise<number[]> {
  const res = await fetch("https://steamspy.com/api.php?request=top100forever", { cache: "no-store" });
  if (!res.ok) return [];
  return Object.keys(await res.json()).map(Number).filter(Boolean);
}

export async function fetchNewReleases(): Promise<number[]> {
  const res = await fetch(
    "https://store.steampowered.com/api/featuredcategories?cc=us&l=en",
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const ids: number[] = [];
  for (const section of ["new_releases", "top_sellers", "specials"]) {
    for (const item of (data?.[section]?.items ?? [])) {
      if (item.id) ids.push(Number(item.id));
    }
  }
  return [...new Set(ids)].filter(Boolean);
}

// ── Queue management ───────────────────────────────────────────────────────
export async function enqueueGames(
  appIds: number[],
  source: string,
  freshnessDays = 7
): Promise<number> {
  const sb = getClient();
  const cutoff = new Date(Date.now() - freshnessDays * 86_400_000).toISOString();
  const { data: recent } = await sb
    .from("games")
    .select("id")
    .in("id", appIds)
    .gt("last_synced_at", cutoff);
  const recentSet = new Set((recent ?? []).map((r: { id: number }) => r.id));
  const toQueue = appIds.filter((id) => !recentSet.has(id));
  if (toQueue.length === 0) return 0;
  await sb.from("crawl_queue").upsert(
    toQueue.map((app_id) => ({ app_id, source, queued_at: new Date().toISOString() })),
    { onConflict: "app_id", ignoreDuplicates: true }
  );
  return toQueue.length;
}

export async function processQueue(batchSize = 50): Promise<{
  synced: number;
  errors: number;
  errorDetails: Array<{ appId: number; error: string }>;
}> {
  const sb = getClient();
  const { data: batch } = await sb
    .from("crawl_queue")
    .select("app_id, attempts")
    .order("queued_at", { ascending: true })
    .limit(batchSize);

  if (!batch?.length) return { synced: 0, errors: 0, errorDetails: [] };

  let synced = 0, errors = 0;
  const errorDetails: Array<{ appId: number; error: string }> = [];

  for (const item of batch as Array<{ app_id: number; attempts: number }>) {
    const result = await syncGame(item.app_id);
    await sleep(400);
    if (result.ok) {
      await sb.from("crawl_queue").delete().eq("app_id", item.app_id);
      synced++;
    } else {
      errors++;
      errorDetails.push({ appId: item.app_id, error: result.error ?? "unknown" });
      if (item.attempts >= 2) {
        await sb.from("crawl_queue").delete().eq("app_id", item.app_id);
      } else {
        await sb.from("crawl_queue")
          .update({ attempts: item.attempts + 1, last_error: result.error })
          .eq("app_id", item.app_id);
      }
    }
  }
  return { synced, errors, errorDetails };
}
