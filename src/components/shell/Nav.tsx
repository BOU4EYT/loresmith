"use client";
import Link          from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore, THEMES }       from "@/lib/store";

const NAV_LINKS = [
  { label: "Discover", href: "/"        },
  { label: "Library",  href: "/library" },
  { label: "Mods",     href: "/mods"    },
  { label: "Wikis",    href: "/wikis"   },
  { label: "Charts",   href: "/charts"  },
];

interface NavProps {
  steamLinked?: boolean;
  steamUsername?: string;
}

export function Nav({ steamLinked, steamUsername }: NavProps) {
  const pathname   = usePathname();
  const router     = useRouter();
  const theme      = useStore((s) => s.theme);
  const density    = useStore((s) => s.density);
  const setTheme   = useStore((s) => s.setTheme);
  const setDensity = useStore((s) => s.setDensity);

  return (
    <nav className="nav">
      {/* Logo */}
      <div className="nav-logo">
        <span className="nav-br">[</span>
        LORESMITH
        <span className="nav-br">]</span>
      </div>

      {/* Page links */}
      <div className="nav-links">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`nl${pathname === l.href ? " on" : ""}`}
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* Right-side controls */}
      <div className="nav-r">
        {/* Theme swatches */}
        <div className="tpick">
          {THEMES.map((t) => (
            <button
              key={t.key}
              className={`tdot${theme === t.key ? " sel" : ""}`}
              title={t.label}
              style={{
                background:  t.primary,
                boxShadow:   theme === t.key ? `0 0 8px ${t.primary}` : undefined,
              }}
              onClick={() => setTheme(t.key)}
            />
          ))}
        </div>

        {/* Steam status */}
        {steamLinked ? (
          <div className="status">
            <div className="sdot" />
            {steamUsername ?? "STEAM LINKED"}
          </div>
        ) : (
          <div className="status" style={{ color: "var(--t3)" }}>
            <div className="sdot" style={{ background: "var(--t3)", boxShadow: "none", animation: "none" }} />
            STEAM OFFLINE
          </div>
        )}

        {/* Density toggle */}
        <div className="dtog">
          {(["compact", "standard"] as const).map((d) => (
            <button
              key={d}
              className={`dbt${density === d ? " on" : ""}`}
              onClick={() => setDensity(d)}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Profile */}
        {steamLinked ? (
          <button className="btn" style={{ fontSize: 10, padding: "5px 14px" }}>
            PROFILE
          </button>
        ) : (
          <a
            href={`/auth/steam/callback?return_to=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "/")}`}
            className="btn"
            style={{ fontSize: 10, padding: "5px 14px" }}
          >
            ↗ SIGN IN
          </a>
        )}
      </div>
    </nav>
  );
}
