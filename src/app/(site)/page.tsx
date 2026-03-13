import { createClient }      from "@/lib/supabase/server";
import { GameGrid }          from "@/components/GameGrid";
import { MechanicSidebar }   from "@/components/MechanicSidebar";
import { HeroSearch }        from "@/components/HeroSearch";
import { SortSelect }        from "@/components/SortSelect";
import type { GameSummary }  from "@/lib/types";

// Maps mood keys → mechanic slugs for filtering
const MOOD_MECHANIC_MAP: Record<string, string[]> = {
  cosy:    ["simulation", "crafting", "farming"],
  tension: ["combat", "horror", "survival"],
  story:   ["narrative", "rpg", "adventure"],
  onemore: ["roguelite", "roguelike", "arcade"],
  thinker: ["puzzle", "strategy", "turn-based"],
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; mechanic?: string; mood?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  // Resolve mood → mechanic slugs
  const moodMechanics = params.mood ? (MOOD_MECHANIC_MAP[params.mood] ?? []) : [];
  const mechanicSlugs = [
    ...(params.mechanic ? [params.mechanic] : []),
    ...moodMechanics,
  ];

  // ── Game results ──────────────────────────────────────────────────────
  let games: GameSummary[] = [];

  if (params.q) {
    const { data } = await sb.rpc("search_games", { query: params.q, lim: 48 });
    games = (data as GameSummary[]) ?? [];
  } else {
    const { data } = await sb.rpc("discover_games", {
      mechanic_slugs: mechanicSlugs.length > 0 ? mechanicSlugs : null,
      exclude_owned:  user?.id ?? null,
      lim: 48,
    });
    games = (data as GameSummary[]) ?? [];
  }

  // ── Sanitise NaN steam_pct values from DB (PostgreSQL IEEE 754 NaN) ───
  games = games.map((g) => ({
    ...g,
    steam_pct: g.steam_pct !== null && !Number.isNaN(g.steam_pct) ? g.steam_pct : null,
  }));

  // ── Client-side sort (after fetch) ────────────────────────────────────
  if (params.sort === "score") {
    games = [...games].sort((a, b) => {
      const pa = a.steam_pct ?? 0;
      const pb = b.steam_pct ?? 0;
      return pb - pa;
    });
  } else if (params.sort === "price_asc") {
    games = [...games].sort((a, b) => {
      if (a.is_free) return -1;
      if (b.is_free) return 1;
      return (a.price_usd ?? 999) - (b.price_usd ?? 999);
    });
  }
  // "relevance" = natural RPC order

  // ── Owned game IDs + library list ─────────────────────────────────────
  const ownedIds = new Set<number>();
  let libraryGames: Array<{ title: string; playtime_mins: number; slug: string }> = [];

  if (user) {
    const { data: lib } = await sb
      .from("user_library")
      .select("game_id, playtime_mins, games(title, slug)")
      .eq("user_id", user.id)
      .order("playtime_mins", { ascending: false })
      .limit(20);

    lib?.forEach((l) => {
      ownedIds.add(l.game_id);
      const g = l.games as unknown as { title: string; slug: string } | null;
      if (g) libraryGames.push({ title: g.title, slug: g.slug, playtime_mins: l.playtime_mins });
    });
  }

  // ── Mechanic list (sidebar) ────────────────────────────────────────────
  const { data: mechanics } = await sb
    .from("mechanics")
    .select("slug, label")
    .is("parent_id", null)
    .order("label");

  const heading = params.q
    ? `Results for "${params.q}"`
    : params.mood || params.mechanic
    ? "Filtered Results"
    : "Recommended For You";

  return (
    <>
      <HeroSearch librarySize={ownedIds.size} />

      <div className="lay">
        <MechanicSidebar
          mechanics={mechanics ?? []}
          activeMechanic={params.mechanic}
          activeMood={params.mood}
          libraryGames={libraryGames}
        />

        <div className="con">
          <div className="sechd">
            <div className="sect">
              {heading}
              <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--t3)" }}>
                {games.length} results
              </span>
            </div>
            <SortSelect current={params.sort} />
          </div>

          <GameGrid games={games} ownedIds={ownedIds} />
        </div>
      </div>
    </>
  );
}
