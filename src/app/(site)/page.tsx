import { createClient }        from "@/lib/supabase/server";
import { GameGrid }            from "@/components/GameGrid";
import { MechanicSidebar }     from "@/components/MechanicSidebar";
 
export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; mechanic?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
 
  // Run the right query based on whether user is searching or browsing
  let games;
  if (resolvedSearchParams.q) {
    const { data } = await sb.rpc("search_games",
      { query: resolvedSearchParams.q, lim: 24 });
    games = data ?? [];
  } else {
    const { data } = await sb.rpc("discover_games", {
      mechanic_slugs: resolvedSearchParams.mechanic ? [resolvedSearchParams.mechanic] : null,
      exclude_owned:  user?.id ?? null,
      lim: 24,
    });
    games = data ?? [];
  }
 
  // Get owned game IDs for badge display
  const ownedIds = new Set<number>();
  if (user) {
    const { data: lib } = await sb.from("user_library")
      .select("game_id").eq("user_id", user.id);
    lib?.forEach(l => ownedIds.add(l.game_id));
  }
 
  // Mechanics for sidebar filter
  const { data: mechanics } = await sb.from("mechanics")
    .select("slug, label").is("parent_id", null).order("label");
 
  return (
    <div className="flex">
      <MechanicSidebar mechanics={mechanics ?? []} active={resolvedSearchParams.mechanic} />
      <main className="flex-1 p-6">
        <GameGrid games={games} ownedIds={ownedIds} />
      </main>
    </div>
  );
}
