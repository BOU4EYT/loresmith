"use client";
import Link         from "next/link";
import { Mechanic } from "@/lib/types";

interface MechanicSidebarProps {
  mechanics:       Mechanic[];
  activeMechanic?: string;
  activeMood?:     string;
  libraryGames:    Array<{ title: string; playtime_mins: number; slug: string }>;
}

const MOODS = [
  { label: "Cosy & chill",    count: "14k", key: "cosy"    },
  { label: "High tension",    count: "22k", key: "tension" },
  { label: "Story first",     count: "31k", key: "story"   },
  { label: "Just 1 more run", count: "18k", key: "onemore" },
  { label: "Need to think",   count: "9k",  key: "thinker" },
];

function fmtHours(mins: number) {
  const h = Math.round(mins / 60);
  return h > 0 ? `${h}h` : "—";
}

export function MechanicSidebar({
  mechanics,
  activeMechanic,
  activeMood,
  libraryGames,
}: MechanicSidebarProps) {
  return (
    <aside className="sb">
      {/* Mood filters */}
      <div className="sbs">
        <div className="sbl">Filter · Mood</div>
        {MOODS.map((m) => (
          <Link
            key={m.key}
            href={activeMood === m.key ? "/" : `/?mood=${m.key}`}
            className={`sbi${activeMood === m.key ? " on" : ""}`}
          >
            <span>{m.label}</span>
            <span className="sbc">{m.count}</span>
          </Link>
        ))}
      </div>

      {/* Mechanic filters */}
      {mechanics.length > 0 && (
        <div className="sbs">
          <div className="sbl">Filter · Mechanic</div>
          {mechanics.map((m) => (
            <Link
              key={m.slug}
              href={activeMechanic === m.slug ? "/" : `/?mechanic=${m.slug}`}
              className={`sbi${activeMechanic === m.slug ? " on" : ""}`}
            >
              <span>{m.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Library */}
      {libraryGames.length > 0 && (
        <div className="sbs">
          <div className="sbl">Your Library</div>
          {libraryGames.slice(0, 10).map((g) => (
            <Link key={g.slug} href={`/game/${g.slug}`} className="sbi">
              <span style={{ color: "var(--g)", fontSize: 10, marginRight: 4 }}>■</span>
              <span style={{ flex: 1 }}>{g.title}</span>
              <span className="sbc">{fmtHours(g.playtime_mins)}</span>
            </Link>
          ))}
        </div>
      )}
    </aside>
  );
}
