import { NextRequest, NextResponse } from "next/server";
import { createClient }            from "@/lib/supabase/server";
import { verifySteamCallback }     from "@/lib/steam/openid";
import { getSteamProfile, getSteamLibrary } from "@/lib/steam/api";
 
export async function GET(req: NextRequest) {
  const params   = new URL(req.url).searchParams;
  const supabase = await createClient();
 
  // 1. Verify with Steam
  const steamId = await verifySteamCallback(params);
  if (!steamId) return NextResponse.redirect("/?error=steam_auth");
 
  // 2. Fetch Steam profile
  const profile = await getSteamProfile(steamId);
  if (!profile)  return NextResponse.redirect("/?error=steam_profile");
 
  // 3. Sign in or create Supabase user
  // Steam has no email — we use a synthetic one
  const email    = `${steamId}@steam.loresmith`;
  const password = steamId;  // deterministic, not user-facing
 
  const { data: existing } = await supabase.auth.signInWithPassword({ email, password });
  let userId = existing?.user?.id;
 
  if (!userId) {
    const { data: created } = await supabase.auth.signUp({ email, password });
    userId = created?.user?.id;
  }
 
  if (!userId) return NextResponse.redirect("/?error=signup_failed");
 
  // 4. Upsert Steam profile data
  await supabase.from("profiles").upsert({
    id:             userId,
    steam_id:       steamId,
    steam_username: profile.personaname,
    steam_avatar:   profile.avatarfull,
    profile_url:    profile.profileurl,
    is_public:      profile.communityvisibilitystate === 3,
    updated_at:     new Date().toISOString(),
  });
 
  // 5. Sync library if public profile
  if (profile.communityvisibilitystate === 3) {
    const games = await getSteamLibrary(steamId);
    const rows  = games.map(g => ({
      user_id:       userId,
      game_id:       g.appid,
      playtime_mins: g.playtime_forever,
      last_played:   g.rtime_last_played
        ? new Date(g.rtime_last_played * 1000).toISOString() : null,
      synced_at: new Date().toISOString(),
    }));
    // Upsert in batches (Supabase row limit per request)
    for (let i = 0; i < rows.length; i += 500)
      await supabase.from("user_library")
        .upsert(rows.slice(i, i + 500), { onConflict: "user_id,game_id" });
  }
 
  return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL + "/");
}
