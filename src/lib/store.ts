"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeKey = "CYAN" | "AMBER" | "GREEN" | "RED" | "GHOST" | "SYNTHWAVE";
export type Density  = "standard" | "compact";

export interface ThemeDefinition {
  key:     ThemeKey;
  label:   string;
  primary: string; // used to render the colour swatch
}

export const THEMES: ThemeDefinition[] = [
  { key: "CYAN",      label: "Default",    primary: "#00d4ff" },
  { key: "AMBER",     label: "Phosphor",   primary: "#ffaa00" },
  { key: "GREEN",     label: "Matrix",     primary: "#00ff41" },
  { key: "RED",       label: "Classified", primary: "#ff0033" },
  { key: "GHOST",     label: "Ghost",      primary: "#1a1f2e" },
  { key: "SYNTHWAVE", label: "Synthwave",  primary: "#ff00ff" },
];

interface LoreState {
  theme:   ThemeKey;
  density: Density;
  booted:  boolean;
  setTheme:   (t: ThemeKey) => void;
  setDensity: (d: Density)  => void;
  setBooted:  ()            => void;
}

export const useStore = create<LoreState>()(
  persist(
    (set) => ({
      theme:      "CYAN",
      density:    "standard",
      booted:     false,
      setTheme:   (theme)   => {
        set({ theme });
        // Sync to html[data-theme] immediately — no flash on hot reload
        if (typeof document !== "undefined")
          document.documentElement.dataset.theme = theme;
      },
      setDensity: (density) => set({ density }),
      setBooted:  ()        => set({ booted: true }),
    }),
    {
      name:    "ls-prefs",
      // Only persist theme and density — boot should replay each session
      partialize: (s) => ({ theme: s.theme, density: s.density }),
    }
  )
);
