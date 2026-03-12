import { createClient } from "@supabase/supabase-js";
 
// Use service role for writes — never expose to client
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
 
export async function syncGameDetails(appId: number) {
  const res  = await fetch(
    `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&l=en`
  );
  const json = await res.json();
  const d    = json?.[appId]?.data;
  if (!d) return;
 
  const slug = d.name.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    + "-" + appId;   // append appId to avoid slug collisions
 
  await sb.from("games").upsert({
    id:          appId,
    slug,
    title:       d.name,
    studio:      d.developers?.[0] ?? null,
    publisher:   d.publishers?.[0] ?? null,
    short_desc:  d.short_description,
    description: d.detailed_description,
    release_date: d.release_date?.date
      ? new Date(d.release_date.date).toISOString() : null,
    is_free:     d.is_free,
    price_usd:   d.price_overview ? d.price_overview.final / 100 : null,
    steam_url:   `https://store.steampowered.com/app/${appId}`,
    header_image: d.header_image,
    updated_at:  new Date().toISOString(),
  }, { onConflict: "id" });
}
 
export async function syncReviews(appId: number) {
  const res  = await fetch(
    `https://store.steampowered.com/appreviews/${appId}?json=1&language=all`
  );
  const json = await res.json();
  const s    = json?.query_summary;
  if (!s) return;
  await sb.from("games").update({
    steam_positive: s.total_positive ?? 0,
    steam_negative: s.total_negative ?? 0,
    updated_at:     new Date().toISOString(),
  }).eq("id", appId);
}
 
export async function syncSteamSpyTags(appId: number) {
  const res  = await fetch(
    `https://steamspy.com/api.php?request=appdetails&appid=${appId}`
  );
  const data = await res.json();
  const tags: Record<string, number> = data?.tags ?? {};
 
  for (const [label, votes] of Object.entries(tags)) {
    const { data: tag } = await sb.from("steam_tags")
      .upsert({ label }, { onConflict: "label" })
      .select("id").single();
 
    if (tag) await sb.from("game_steam_tags").upsert({
      game_id: appId, tag_id: tag.id, vote_count: votes,
    }, { onConflict: "game_id,tag_id" });
  }
}
