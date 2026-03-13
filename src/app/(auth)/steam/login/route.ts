import { NextRequest, NextResponse } from "next/server";
import { getSteamLoginURL } from "@/lib/steam/openid";

export async function GET(req: NextRequest) {
  const returnTo = new URL(req.url).searchParams.get("return_to") ?? "/";
  const callback =
    process.env.NEXT_PUBLIC_APP_URL + "/auth/steam/callback?return_to=" +
    encodeURIComponent(returnTo);
  return NextResponse.redirect(getSteamLoginURL(callback));
}
