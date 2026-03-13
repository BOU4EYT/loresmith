export default function WikisPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 52px)", textAlign: "center", gap: 16 }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 48, color: "var(--p)", opacity: 0.15 }}>📖</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 13, letterSpacing: 4, textTransform: "uppercase", color: "var(--p)" }}>WIKI ENGINE // LOADING</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--t3)", letterSpacing: 1, maxWidth: 400, lineHeight: 1.7 }}>
        Structured game wikis — every mechanic, item, build, and secret. Indexed, searchable, and version-gated across the full database.
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: 2, color: "var(--t3)", padding: "4px 12px", border: "1px solid var(--b)", borderRadius: 2, marginTop: 8 }}>
        ETA: PHASE 1
      </div>
    </div>
  );
}
