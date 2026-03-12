import { createClient }      from "@/lib/supabase/server";
import { GameGrid }          from "@/components/GameGrid";
import { MechanicSidebar }   from "@/components/MechanicSidebar";
import { HeroSearch }        from "@/components/HeroSearch";
import type { GameSummary }  from "@/lib/types";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: { q?: string; mechanic?: string };
}) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  // ── Game results ───────────────────────────────────────────────────────
  let games: GameSummary[] = [];

  if (searchParams.q) {
    const { data } = await sb.rpc("search_games", { query: searchParams.q, lim: 24 });
    games = (data as GameSummary[]) ?? [];
  } else {
    const { data } = await sb.rpc("discover_games", {
      mechanic_slugs: searchParams.mechanic ? [searchParams.mechanic] : null,
      exclude_owned:  user?.id ?? null,
      lim: 24,
    });
    games = (data as GameSummary[]) ?? [];
  }

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

  return (
    <>
      <HeroSearch librarySize={ownedIds.size} />

      <div className="lay">
        <MechanicSidebar
          mechanics={mechanics ?? []}
          active={searchParams.mechanic}
          libraryGames={libraryGames}
        />

        <div className="con">
          <div className="sechd">
            <div className="sect">
              {searchParams.q ? `Results for "${searchParams.q}"` : "Recommended For You"}
              <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--t3)" }}>
                {games.length} results
              </span>
            </div>
            <select className="fsel">
              <option>SORT: RELEVANCE</option>
              <option>SORT: SCORE</option>
              <option>SORT: RELEASE</option>
            </select>
          </div>

          <GameGrid games={games} ownedIds={ownedIds} />
        </div>
      </div>
    </>
  );
}
