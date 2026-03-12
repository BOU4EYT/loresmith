import { createClient }  from "@/lib/supabase/server";
import { notFound }      from "next/navigation";
import { GamePageUI }    from "@/components/GamePageUI";
import type { GameDetail } from "@/lib/types";

export default async function GamePage({ params }: { params: { slug: string } }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();

  // Core game data + mechanics
  const { data: game } = await sb
    .from("games")
    .select(`
      *,
      game_mechanics ( confidence, mechanics ( slug, label ) )
    `)
    .eq("slug", params.slug)
    .single();

  if (!game) notFound();

  // Ownership + playtime
  let owned        = false;
  let playtime_mins = 0;
  if (user) {
    const { data: lib } = await sb
      .from("user_library")
      .select("playtime_mins")
      .eq("user_id", user.id)
      .eq("game_id", game.id)
      .single();
    owned         = !!lib;
    playtime_mins = lib?.playtime_mins ?? 0;
  }

  // Wiki overview page
  const { data: wiki } = await sb
    .from("wiki_pages")
    .select("content, game_version, is_outdated")
    .eq("game_id", game.id)
    .eq("slug", "overview")
    .single();

  // Version-gated video guides (only videos matching the current wiki version)
  const { data: videos } = await sb
    .from("video_guides")
    .select("youtube_id, title, game_version, topic")
    .eq("game_id", game.id)
    .eq("approved", true)
    .eq("game_version", wiki?.game_version ?? "");

  // Steam review percentage
  const steamPositive = game.steam_positive ?? 0;
  const steamNegative = game.steam_negative ?? 0;

  const detail: GameDetail = {
    id:            game.id,
    slug:          game.slug,
    title:         game.title,
    studio:        game.studio,
    publisher:     game.publisher,
    genre:         game.game_mechanics?.[0]?.mechanics?.label ?? null,
    short_desc:    game.short_desc,
    description:   game.description,
    release_date:  game.release_date,
    steam_url:     game.steam_url,
    header_image:  game.header_image,
    price_usd:     game.price_usd,
    is_free:       game.is_free ?? false,
    steam_positive: steamPositive,
    steam_negative: steamNegative,
    steam_pct:     steamPositive + steamNegative > 0
      ? Math.round((steamPositive / (steamPositive + steamNegative)) * 100)
      : null,
    owned,
    playtime_mins,
    mechanics: (game.game_mechanics ?? []).map((gm: { confidence: number; mechanics: { slug: string; label: string } }) => ({
      slug:       gm.mechanics.slug,
      label:      gm.mechanics.label,
      confidence: gm.confidence,
    })),
    wiki:   wiki  ?? null,
    videos: videos ?? null,
    tags:   (game.game_mechanics ?? [])
      .slice(0, 3)
      .map((gm: { mechanics: { label: string } }) => gm.mechanics.label),
  };

  return <GamePageUI game={detail} />;
}
