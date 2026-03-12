import { NextResponse }   from "next/server";
import { createClient }  from "@/lib/supabase/server";
import { getSteamLibrary } from "@/lib/steam/api";
 
export async function POST() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
 
  const { data: profile } = await sb.from("profiles")
    .select("steam_id, is_public").eq("id", user.id).single();
 
  if (!profile?.steam_id || !profile.is_public)
    return NextResponse.json({ error: "No public Steam profile" }, { status: 400 });
 
  const games = await getSteamLibrary(profile.steam_id);
  const rows  = games.map(g => ({
    user_id:       user.id,
    game_id:       g.appid,
    playtime_mins: g.playtime_forever,
    last_played:   g.rtime_last_played
      ? new Date(g.rtime_last_played * 1000).toISOString() : null,
    synced_at: new Date().toISOString(),
  }));
 
  for (let i = 0; i < rows.length; i += 500)
    await sb.from("user_library")
      .upsert(rows.slice(i, i + 500), { onConflict: "user_id,game_id" });
 
  return NextResponse.json({ synced: rows.length });
}
