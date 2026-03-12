const BASE = "https://api.steampowered.com";
const KEY  = () => process.env.STEAM_API_KEY!;
 
export interface SteamProfile {
  steamid:                  string;
  personaname:              string;
  avatarfull:               string;
  profileurl:               string;
  communityvisibilitystate: number; // 3 = public
}
 
export interface SteamGame {
  appid:             number;
  playtime_forever:  number;  // minutes
  rtime_last_played: number;  // unix timestamp
}
 
export async function getSteamProfile(id: string): Promise<SteamProfile | null> {
  const url = `${BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${KEY()}&steamids=${id}`;
  const res  = await fetch(url, { next: { revalidate: 300 } });
  const data = await res.json();
  return data?.response?.players?.[0] ?? null;
}
 
export async function getSteamLibrary(id: string): Promise<SteamGame[]> {
  const url = `${BASE}/IPlayerService/GetOwnedGames/v1/`
            + `?key=${KEY()}&steamid=${id}`
            + `&include_appinfo=false&include_played_free_games=true`;
  const res  = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  return data?.response?.games ?? [];   // empty if profile is private
}
