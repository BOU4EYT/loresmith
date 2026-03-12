import { createClient } from "@/lib/supabase/server";
import { notFound }    from "next/navigation";
 
export default async function GamePage({ params }: { params: { slug: string } }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
 
  const { data: game } = await sb.from("games")
    .select(`*, game_mechanics(confidence, mechanics(slug, label))`)
    .eq("slug", params.slug).single();
 
  if (!game) notFound();
 
  // Check ownership + playtime
  let owned = false, playtime = 0;
  if (user) {
    const { data: lib } = await sb.from("user_library")
      .select("playtime_mins").eq("user_id", user.id).eq("game_id", game.id).single();
    owned    = !!lib;
    playtime = lib?.playtime_mins ?? 0;
  }
 
  // Wiki + version-gated videos
  const { data: wiki }   = await sb.from("wiki_pages")
    .select("content, game_version, is_outdated")
    .eq("game_id", game.id).eq("slug", "overview").single();
 
  const { data: videos } = await sb.from("video_guides")
    .select("youtube_id, title, game_version, topic")
    .eq("game_id", game.id).eq("approved", true)
    .eq("game_version", wiki?.game_version ?? "");  // version gate enforced here
 
  return (
    <div>
      {/* Wire your mockup components in here */}
      {/* game, owned, playtime, wiki, videos are all ready */}
    </div>
  );
}
