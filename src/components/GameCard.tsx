"use client";
import Link          from "next/link";
import { GameSummary } from "@/lib/types";

// Deterministic fallback gradient from game ID (no image flash)
function fallbackGrad(id: number) {
  const hue = (id * 137.508) % 360;
  return `linear-gradient(135deg, hsl(${hue} 40% 8%), hsl(${(hue + 40) % 360} 50% 5%))`;
}

function steamPctLabel(pct: number | null) {
  if (pct === null) return null;
  if (pct >= 95) return "Overwhelmingly Positive";
  if (pct >= 80) return "Very Positive";
  if (pct >= 70) return "Mostly Positive";
  return `${Math.round(pct)}% positive`;
}

function priceLabel(game: GameSummary) {
  if (game.owned)    return "In Library";
  if (game.is_free)  return "Free";
  if (game.price_usd) return `$${game.price_usd.toFixed(2)}`;
  return "N/A";
}

/* ── Standard card ── */
export function GameCardStd({ game }: { game: GameSummary }) {
  const grad  = fallbackGrad(game.id);
  const price = priceLabel(game);

  return (
    <div className="cstd">
      <div className="ccorner" />
      <div className="cscan" />

      {/* Thumbnail */}
      <div className="cimg" style={{ background: grad }}>
        {game.header_image
          ? <img src={game.header_image} alt={game.title} loading="lazy" />
          : <span className="cimgl">{game.title.slice(0, 2).toUpperCase()}</span>
        }
        {game.genre && <span className="cgen">{game.genre}</span>}
        {game.owned && <span className="cown">■ OWNED</span>}
      </div>

      {/* Body */}
      <div className="cbody">
        <div className="ctit">{game.title}</div>
        {game.studio && (
          <div className="cwhy">{game.studio}</div>
        )}
        <div className="cmeta">
          <div className="cscore">
            {game.steam_pct !== null && !isNaN(game.steam_pct) ? `★ ${Math.round(game.steam_pct)}%` : ""}
          </div>
          <div className="ctags">
            {(game.tags ?? []).slice(0, 2).map((t) => (
               <span key={t} className="ctag">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="cacts">
        <Link href={`/game/${game.slug}`} className="cbt">Wiki</Link>
        <a
          href={`https://store.steampowered.com/app/${game.id}`}
          target="_blank"
          rel="noopener"
          className="cbt a"
        >
          {game.owned ? "↗ Steam" : `↗ ${price}`}
        </a>
      </div>
    </div>
  );
}

/* ── Compact row ── */
export function GameCardCompact({ game, rank }: { game: GameSummary; rank: number }) {
  const grad  = fallbackGrad(game.id);
  const price = priceLabel(game);

  return (
    <div className="ccmp">
      <span className="cnum">{String(rank).padStart(2, "0")}</span>

      <div className="cthumb" style={{ background: grad }}>
        {game.header_image && (
          <img src={game.header_image} alt={game.title} loading="lazy" />
        )}
      </div>

      <div className="cinf">
        <div className="cctit">{game.title}</div>
        <div className="ccwhy">{game.studio ?? game.genre ?? ""}</div>
      </div>

      <div className="ccr">
        <div className="ctags">
          {(game.tags ?? []).slice(0, 1).map((t) => (
             <span key={t} className="ctag">{t}</span>
          ))}
        </div>
        {game.steam_pct !== null && !isNaN(game.steam_pct) && (
          <span className="ccscore">★{Math.round(game.steam_pct)}%</span>
        )}
        <Link href={`/game/${game.slug}`} className="ccbt">Wiki</Link>
        <a
          href={`https://store.steampowered.com/app/${game.id}`}
          target="_blank"
          rel="noopener"
          className="ccbt a"
        >
          {game.owned ? "↗ Steam" : price}
        </a>
      </div>
    </div>
  );
}
