"use client";
import { useState, useEffect } from "react";
import { useStore }            from "@/lib/store";

const BOOT_LINES = [
  { t: "LORESMITH OS v2.4.1 — INITIALIZING",          d: 0,    col: "#p", bold: true  },
  { t: "────────────────────────────────────────────────", d: 80,   col: "#t3"          },
  { t: "[ OK ] Mounting knowledge base filesystem...", d: 180,  col: "#t2"             },
  { t: "[ OK ] Loading Steam API bridge.............", d: 310,  col: "#t2"             },
  { t: "[ OK ] Authenticating session token.........", d: 440,  col: "#t2"             },
  { t: "[ OK ] Fetching user library.................", d: 560,  col: "#g"              },
  { t: "[ OK ] Building discovery index (124,284 titles)", d: 690, col: "#t2"          },
  { t: "[ OK ] Calibrating recommendation engine...", d: 820,  col: "#t2"             },
  { t: "[ OK ] Syncing SteamDB price cache..........", d: 950,  col: "#t2"             },
  { t: "[ OK ] Initializing wiki renderer...........", d: 1060, col: "#t2"             },
  { t: "[ OK ] Loading mod hub connectors...........", d: 1160, col: "#t2"             },
  { t: "────────────────────────────────────────────────", d: 1260, col: "#t3"          },
  { t: "ALL SYSTEMS NOMINAL",                          d: 1350, col: "#g", bold: true  },
  { t: "WELCOME BACK, OPERATIVE.",                     d: 1480, col: "#p", bold: true  },
];

const BARS = [
  { label: "CORE SYSTEMS", d: 350  },
  { label: "STEAM BRIDGE", d: 580  },
  { label: "WIKI ENGINE",  d: 850  },
  { label: "DISCOVERY",    d: 1150 },
];

const COL_MAP: Record<string, string> = {
  "#p":  "var(--p)",
  "#t2": "var(--t2)",
  "#t3": "var(--t3)",
  "#g":  "var(--g)",
};

export function BootScreen() {
  const setBooted = useStore((s) => s.setBooted);

  const [lines,  setLines]  = useState<typeof BOOT_LINES>([]);
  const [pcts,   setPcts]   = useState([0, 0, 0, 0]);
  const [ready,  setReady]  = useState(false);
  const [out,    setOut]    = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_LINES.forEach((l) =>
      timers.push(setTimeout(() => setLines((p) => [...p, l]), l.d))
    );
    BARS.forEach((b, i) =>
      timers.push(
        setTimeout(() =>
          setPcts((p) => { const n = [...p]; n[i] = 100; return n; }), b.d)
      )
    );
    timers.push(setTimeout(() => setReady(true), 1800));
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleEnter = () => {
    setOut(true);
    setTimeout(setBooted, 750);
  };

  return (
    <div className={`boot${out ? " out" : ""}`}>
      <div className="boot-inner">
        {/* Logo */}
        <div className="boot-logo">
          [&nbsp;<span style={{ letterSpacing: 14 }}>LORESMITH</span>&nbsp;]
          <span className="bcursor">_</span>
        </div>

        {/* Console lines */}
        <div className="boot-lines">
          {lines.map((l, i) => (
            <div
              key={i}
              className="boot-line"
              style={{ color: COL_MAP[l.col] ?? "var(--t)", fontWeight: l.bold ? 700 : 400 }}
            >
              {l.t}
            </div>
          ))}
        </div>

        {/* Progress bars */}
        <div className="boot-bars">
          {BARS.map((b, i) => (
            <div key={b.label} className="bbar-row">
              <span className="bbar-label">{b.label}</span>
              <div className="bbar-track">
                <div className="bbar-fill" style={{ width: `${pcts[i]}%` }} />
              </div>
              <span className="bbar-pct">{pcts[i]}%</span>
            </div>
          ))}
        </div>

        {/* Enter button — fades in via CSS animation */}
        {ready && (
          <button className="boot-enter" onClick={handleEnter}>
            ▸ &nbsp; ENTER LORESMITH
          </button>
        )}
      </div>
    </div>
  );
}
