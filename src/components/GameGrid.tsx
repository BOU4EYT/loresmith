"use client";
import { useStore }         from "@/lib/store";
import { GameSummary }      from "@/lib/types";
import { GameCardStd, GameCardCompact } from "@/components/GameCard";

interface GameGridProps {
  games:    GameSummary[];
  ownedIds: Set<number>;
}

export function GameGrid({ games, ownedIds }: GameGridProps) {
  const density = useStore((s) => s.density);

  // Merge ownership into the game summaries
  const enriched = games.map((g) => ({
    ...g,
    owned: ownedIds.has(g.id),
  }));

  if (enriched.length === 0) {
    return <div className="empty">NO RESULTS // TRY A DIFFERENT QUERY</div>;
  }

  if (density === "compact") {
    return (
      <div className="gcmp">
        {enriched.map((g, i) => (
          <GameCardCompact key={g.id} game={g} rank={i + 1} />
        ))}
      </div>
    );
  }

  return (
    <div className="gstd">
      {enriched.map((g) => (
        <GameCardStd key={g.id} game={g} />
      ))}
    </div>
  );
}
