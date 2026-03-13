import { createClient } from "@/lib/supabase/server";

export default async function ChartsPage() {
  const sb = await createClient();

  const { data: topGames } = await sb
    .from("games")
    .select("id, slug, title, studio, steam_positive, steam_negative, header_image")
    .not("steam_positive", "is", null)
    .order("steam_positive", { ascending: false })
    .limit(20);

  const withPct = (topGames ?? []).map((g) => {
    const pos = g.steam_positive ?? 0;
    const neg = g.steam_negative ?? 0;
    const tot = pos + neg;
    return { ...g, pct: tot > 0 ? Math.round((pos / tot) * 100) : 0, reviews: tot };
  }).sort((a, b) => b.pct - a.pct);

  return (
    <>
      <div className="hero" style={{ paddingBottom: 32 }}>
        <div className="hgrid" />
        <div className="hlabel">LORESMITH // CHARTS ENGINE</div>
        <h1 className="htitle" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
          Game <em>Charts</em>
        </h1>
        <p className="hsub">// ranked by steam community rating · live data</p>
      </div>
      <div className="con" style={{ paddingTop: 20 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: 2, color: "var(--t3)", marginBottom: 12, textTransform: "uppercase" }}>
          ▸ Top Rated by Steam Community
        </div>
        <div className="gcmp">
          {withPct.map((g, i) => (
            <a key={g.id} href={`/game/${g.slug}`} className="ccmp" style={{ textDecoration: "none" }}>
              <span className="cnum">{String(i + 1).padStart(2, "0")}</span>
              <div className="cthumb" style={{ background: `hsl(${(g.id * 137) % 360} 40% 8%)` }}>
                {g.header_image && <img src={g.header_image} alt={g.title} loading="lazy" />}
              </div>
              <div className="cinf">
                <div className="cctit">{g.title}</div>
                <div className="ccwhy">{g.studio ?? ""}</div>
              </div>
              <div className="ccr">
                <span className="ccscore">★ {g.pct}%</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--t3)" }}>
                  {g.reviews.toLocaleString()} reviews
                </span>
              </div>
            </a>
          ))}
          {withPct.length === 0 && (
            <div style={{ padding: "60px 0", textAlign: "center", fontFamily: "var(--mono)", fontSize: 11, color: "var(--t3)", letterSpacing: 2 }}>
              NO DATA YET // RUN GAME SYNC FIRST
            </div>
          )}
        </div>
      </div>
    </>
  );
}
