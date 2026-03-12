"use client";
import { useState }  from "react";
import Link          from "next/link";
import { GameDetail } from "@/lib/types";

function fallbackGrad(id: number) {
  const hue = (id * 137.508) % 360;
  return `linear-gradient(135deg, hsl(${hue} 40% 8%), hsl(${(hue + 40) % 360} 50% 5%))`;
}

function priceLabel(game: GameDetail) {
  if (game.owned)     return `In Library · ${Math.round(game.playtime_mins / 60)}h`;
  if (game.is_free)   return "Free to Play";
  if (game.price_usd) return `$${game.price_usd.toFixed(2)}`;
  return "N/A";
}

function steamPct(game: GameDetail) {
  const pos = game.steam_positive ?? 0;
  const neg = game.steam_negative ?? 0;
  const tot = pos + neg;
  if (tot === 0) return null;
  return Math.round((pos / tot) * 100);
}

type Tab = "overview" | "wiki" | "builds" | "mods" | "videos";

export function GamePageUI({ game }: { game: GameDetail }) {
  const [tab, setTab] = useState<Tab>("overview");
  const grad  = fallbackGrad(game.id);
  const price = priceLabel(game);
  const pct   = steamPct(game);

  const releaseYear = game.release_date
    ? new Date(game.release_date).getFullYear()
    : null;

  return (
    <div>
      {/* ── Hero banner ── */}
      <div style={{ position: "relative" }}>
        <div className="gphero" style={{ background: grad }}>
          {game.header_image && (
            <img src={game.header_image} alt={game.title} />
          )}
          <div
            style={{
              position: "absolute", inset: 0, opacity: 0.04,
              backgroundImage: "linear-gradient(var(--p) 1px,transparent 1px),linear-gradient(90deg,var(--p) 1px,transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div className="gpov" />
        </div>

        <div className="gpcont">
          {/* Mini cover */}
          <div className="gpcover" style={{ background: grad }}>
            {game.header_image
              ? <img src={game.header_image} alt="" />
              : <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--p)", opacity: 0.3, letterSpacing: 2 }}>
                  {game.title.slice(0, 2).toUpperCase()}
                </span>
            }
          </div>

          {/* Title + badges */}
          <div style={{ flex: 1 }}>
            <div className="gpst">
              {game.studio ?? "Unknown Developer"}
              {releaseYear ? ` · ${releaseYear}` : ""}
            </div>
            <div className="gpt">{game.title}</div>
            <div className="gpbdgs">
              {game.genre && <span className="gpbdg">{game.genre}</span>}
              {pct !== null && (
                <span className="gpbdg sc">★ {pct}% positive</span>
              )}
              {game.owned
                ? <span className="gpbdg own">■ {price}</span>
                : <span className="gpbdg">{price}</span>
              }
            </div>
          </div>

          {/* CTA buttons */}
          <div className="gpacts">
            {game.owned
              ? (
                <a href={game.steam_url ?? "#"} target="_blank" rel="noopener" className="btn">
                  ↗ Open in Steam
                </a>
              ) : (
                <a href={game.steam_url ?? "#"} target="_blank" rel="noopener" className="btn btn-a">
                  ↗ View on Steam
                </a>
              )
            }
            <button className="btn">+ Wishlist</button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="gptabs">
        <Link href="/" className="gptab" style={{ marginRight: 8 }}>← Back</Link>
        {(["overview", "wiki", "builds", "mods", "videos"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`gptab${tab === t ? " on" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div className="gpbody">
        <div className="gpmain">
          {tab === "overview" && (
            <>
              {/* Wiki overview */}
              <div className="dblk">
                <div className="dblkh">
                  <em>▸</em> WIKI OVERVIEW
                  {game.wiki && (
                    <div style={{ marginLeft: "auto" }}>
                      <span className={`vtag ${game.wiki.is_outdated ? "old" : "cur"}`}>
                        v{game.wiki.game_version} · {game.wiki.is_outdated ? "OUTDATED" : "CURRENT"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="dblkb">
                  {game.wiki
                    ? (
                      <p style={{ fontFamily: "var(--body)", fontSize: 11, color: "var(--t2)", lineHeight: 1.7 }}>
                        {game.wiki.content}
                      </p>
                    ) : (
                      <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t3)" }}>
                        No wiki content yet. Be the first to contribute.
                      </p>
                    )
                  }
                </div>
              </div>

              {/* Structured data */}
              <div className="dblk">
                <div className="dblkh"><em>▸</em> STRUCTURED DATA</div>
                <div className="dblkb">
                  {[
                    ["DEVELOPER",     game.studio ?? "—",                          ""],
                    ["PUBLISHER",     game.publisher ?? "—",                        ""],
                    ["RELEASE",       releaseYear ? String(releaseYear) : "—",      ""],
                    ["GENRE",         game.genre ?? "—",                            ""],
                    ["STEAM RATING",  pct !== null ? `${pct}% positive` : "—",     "c"],
                    ["PRICE",         price,                                        "g"],
                  ].map(([k, v, cl]) => (
                    <div key={k} className="drow">
                      <span className="dkey">{k}</span>
                      <span className={`dval${cl ? ` ${cl}` : ""}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Short description */}
              {game.short_desc && (
                <div className="dblk">
                  <div className="dblkh"><em>▸</em> ABOUT</div>
                  <div className="dblkb">
                    <p
                      style={{ fontFamily: "var(--body)", fontSize: 11, color: "var(--t2)", lineHeight: 1.7 }}
                      dangerouslySetInnerHTML={{ __html: game.short_desc }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "wiki" && (
            <div className="dblk">
              <div className="dblkh"><em>▸</em> WIKI — COMING SOON</div>
              <div className="dblkb">
                <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t3)" }}>
                  Full wiki editor coming in Phase 1.
                </p>
              </div>
            </div>
          )}

          {tab === "videos" && game.videos && game.videos.length > 0 && (
            <div>
              {game.videos.map((v) => (
                <div key={v.youtube_id} className="dblk">
                  <div className="dblkh">
                    <em>▸</em> {v.title}
                    <span className="vtag cur" style={{ marginLeft: "auto" }}>v{v.game_version}</span>
                  </div>
                  <div className="dblkb" style={{ padding: 0, aspectRatio: "16/9" }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${v.youtube_id}`}
                      style={{ width: "100%", height: "100%", border: "none" }}
                      allowFullScreen
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {(tab === "builds" || tab === "mods") && (
            <div className="dblk">
              <div className="dblkh"><em>▸</em> {tab.toUpperCase()} — COMING SOON</div>
              <div className="dblkb">
                <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t3)" }}>
                  {tab === "builds" ? "Build planner launching in Phase 3." : "Mod hub launching in Phase 2."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="gpside">
          {/* Mechanics */}
          {game.mechanics.length > 0 && (
            <div className="dblk">
              <div className="dblkh"><em>▸</em> MECHANICS</div>
              <div className="dblkb">
                {game.mechanics.map((m) => (
                  <div key={m.slug} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--t3)", letterSpacing: 1, textTransform: "uppercase" }}>
                      {m.label}
                    </span>
                    <div style={{ height: 3, width: 80, background: "var(--b)", borderRadius: 1, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.round(m.confidence * 100)}%`, background: "var(--p)", borderRadius: 1, boxShadow: "var(--glow)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
