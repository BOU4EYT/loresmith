"use client";
import { getSteamLoginURL } from "@/lib/steam/openid";
 
export function SteamLoginButton() {
  const callback = process.env.NEXT_PUBLIC_APP_URL + "/auth/steam/callback";
  return (
    <a href={getSteamLoginURL(callback)}
      className="flex items-center gap-2 px-4 py-2
                 border border-primary text-primary
                 font-mono text-xs tracking-widest uppercase
                 hover:bg-primary/10 transition-all">
      ↗ SIGN IN WITH STEAM
    </a>
  );
}