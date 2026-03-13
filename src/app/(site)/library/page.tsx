import { createClient } from "@/lib/supabase/server";
import { GameGrid }     from "@/components/GameGrid";
import type { GameSummary } from "@/lib/types";

interface LibraryRow {
  game_id:       number;
  playtime_mins: number;
  games: {
    slug:           string;
    title:          string;
    studio:         string | null;
    genre:          string | null;
    steam_positive: number | null;
    steam_negative: number | null;
    price_usd:      number | null;
    is_free:        boolean;
    header_image:   string | null;
  } | null;
}

export default async function LibraryPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    return (
      <div style={{ padding: "80px 32px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--t3)", letterSpacing: 3, marginBottom: 24 }}>
          LIBRARY // NOT LINKED
        </div>
        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--t2)", marginBottom: 24 }}>
          Connect your Steam account to see your library.
        </p>
        <a href="/auth/steam/login" className="btn">↗ SIGN IN WITH STEAM</a>
      </div>
    );
  }

  const { data: lib } = await sb
    .from("user_library")
    .select("game_id, playtime_mins, games(slug, title, studio, genre, steam_positive, steam_negative, price_usd, is_free, header_image)")
    .eq("user_id", user.id)
    .order("playtime_mins", { ascending: false });

  const ownedIds = new Set<number>();
  const games: GameSummary[] = [];

  (lib as LibraryRow[] | null)?.forEach((l) => {
    const g = l.games;
    if (!g) return;
    ownedIds.add(l.game_id);
    const pos = g.steam_positive ?? 0;
    const neg = g.steam_negative ?? 0;
    games.push({
      id:            l.game_id,
      slug:          g.slug,
      title:         g.title,
      studio:        g.studio,
      genre:         g.genre,
      steam_pct:     pos + neg > 0 ? Math.round((pos / (pos + neg)) * 100) : null,
      price_usd:     g.price_usd,
      is_free:       g.is_free ?? false,
      header_image:  g.header_image,
      tags:          [],
      owned:         true,
      playtime_mins: l.playtime_mins,
    });
  });

  const totalHours = Math.round(games.reduce((a, g) => a + g.playtime_mins, 0) / 60);

  return (
    <>
      <div className="hero" style={{ paddingBottom: 32 }}>
        <div className="hgrid" />
        <div className="hlabel">STEAM LIBRARY // SYNCED</div>
        <h1 className="htitle" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
          Your <em>Library</em>
        </h1>
        <p className="hsub">
          // {games.length} game{games.length !== 1 ? "s" : ""} · {totalHours}h total playtime
        </p>
      </div>
      <div className="con" style={{ paddingTop: 20 }}>
        <GameGrid games={games} ownedIds={ownedIds} />
        {games.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", fontFamily: "var(--mono)", fontSize: 11, color: "var(--t3)", letterSpacing: 2 }}>
            NO GAMES FOUND // RUN A LIBRARY SYNC
          </div>
        )}
      </div>
    </>
  );
}
