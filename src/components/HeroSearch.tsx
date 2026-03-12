"use client";
import { useState, useCallback }   from "react";
import { useRouter, usePathname } from "next/navigation";

const QUICK_TAGS = [
  "souls-like", "narrative", "roguelite", "co-op",
  "puzzle", "cosy", "mystery", "open world",
];

interface HeroSearchProps {
  gameCount?:  number;
  wikiCount?:  number;
  username?:   string;
  librarySize: number;
}

export function HeroSearch({
  gameCount  = 124284,
  wikiCount  = 8200,
  username,
  librarySize,
}: HeroSearchProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");

  const submit = useCallback(
    (value: string) => {
      const query = value.trim();
      if (!query) { router.push("/"); return; }
      router.push(`/?q=${encodeURIComponent(query)}`);
    },
    [router]
  );

  return (
    <div className="hero">
      <div className="hgrid" />
      <div className="hglow" />

      {/* Top-right stats */}
      <div className="hstats">
        <div style={{ textAlign: "right" }}>
          <span className="hsvl">{(gameCount / 1000).toFixed(0)}k</span>
          <span className="hslb">Games</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className="hsvl">{(wikiCount / 1000).toFixed(1)}k</span>
          <span className="hslb">Wikis</span>
        </div>
      </div>

      {/* Eyebrow */}
      <div className="hlabel">
        SYSTEM // <em>DISCOVERY ENGINE</em> // ACTIVE
      </div>

      {/* Headline */}
      <h1 className="htitle">
        Find your next<br />
        <em>obsession.</em>
      </h1>

      {/* Subline */}
      <p className="hsub">
        {librarySize > 0
          ? `// based on your steam library · ${librarySize} game${librarySize !== 1 ? "s" : ""} owned · indie + narrative detected`
          : `// connect your steam library for personalised results`}
      </p>

      {/* Search */}
      <div className="sw">
        <span className="spre">›_</span>
        <input
          className="sin"
          placeholder="search games, mechanics, vibes..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit(q)}
        />
        <span className="skbd">⌘K</span>
      </div>

      {/* Quick-filter tag buttons */}
      <div className="htags">
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag}
            className="htag"
            onClick={() => { setQ(tag); submit(tag); }}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
