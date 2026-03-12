import Link from "next/link";

type Game = {
  id: number;
  slug: string;
  title?: string | null;
  name?: string | null;
};

export function GameGrid({
  games,
  ownedIds,
}: {
  games: Game[];
  ownedIds: Set<number>;
}) {
  if (!games.length) {
    return <p className="text-sm text-gray-500">No games found.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((game) => {
        const label = game.title ?? game.name ?? `Game #${game.id}`;
        return (
          <Link
            key={game.id}
            href={`/game/${game.slug}`}
            className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
          >
            <h3 className="font-medium">{label}</h3>
            {ownedIds.has(game.id) ? (
              <p className="mt-1 text-xs text-emerald-600">Owned</p>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
