"use client";
import { useEffect } from "react";
import { useStore }  from "@/lib/store";

/**
 * Invisible component. Mounts once, syncs the Zustand theme to
 * document.documentElement.dataset.theme whenever it changes.
 */
export function ThemeSync() {
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return null;
}
