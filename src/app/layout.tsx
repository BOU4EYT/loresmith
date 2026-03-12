import type { Metadata }       from "next";
import "./globals.css";
import { ThemeScript }          from "@/components/shell/ThemeScript";
import { ThemeSync }            from "@/components/shell/ThemeSync";
import { BootScreen }           from "@/components/shell/BootScreen";
import { CustomCursor }         from "@/components/shell/CustomCursor";
import { Nav }                  from "@/components/shell/Nav";
import { createClient }         from "@/lib/supabase/server";
import AppShell                 from "./AppShell";

export const metadata: Metadata = {
  title:       "Loresmith — discover and master every game",
  description: "One ad-free, community-governed platform to find your next game and master every secret inside it.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  let steamLinked   = false;
  let steamUsername: string | undefined;
  if (user) {
    const { data: profile } = await sb.from("profiles")
      .select("steam_username, is_public")
      .eq("id", user.id)
      .single();
    steamLinked   = !!profile?.steam_username;
    steamUsername = profile?.steam_username ?? undefined;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Sets data-theme before React hydrates — no flash */}
        <ThemeScript />
      </head>
      <body>
        <ThemeSync />
        <AppShell steamLinked={steamLinked} steamUsername={steamUsername}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
