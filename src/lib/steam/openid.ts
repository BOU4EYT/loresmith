const STEAM_OPENID = "https://steamcommunity.com/openid/login";
const STEAM_ID_RE  = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;
 
export function getSteamLoginURL(returnTo: string): string {
  const p = new URLSearchParams({
    "openid.ns":         "http://specs.openid.net/auth/2.0",
    "openid.mode":       "checkid_setup",
    "openid.return_to":  returnTo,
    "openid.realm":      process.env.STEAM_OPENID_REALM!,
    "openid.identity":   "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return STEAM_OPENID + "?" + p.toString();
}
 
export async function verifySteamCallback(
  params: URLSearchParams
): Promise<string | null> {
  const verify = new URLSearchParams(params);
  verify.set("openid.mode", "check_authentication");
 
  const res = await fetch(STEAM_OPENID, {
    method: "POST", body: verify,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
 
  const text = await res.text();
  if (!text.includes("is_valid:true")) return null;
 
  const claimed = params.get("openid.claimed_id") ?? "";
  const match   = claimed.match(STEAM_ID_RE);
  return match ? match[1] : null;
}
