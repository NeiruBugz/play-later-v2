/* SavePoint — game-detail supporting panels, recreated to match the live page:
   header StatusPill, screenshots strip, Times to beat, Themes/Genres/Platforms,
   Journal feed, Related games. Depends on kit.jsx + playthroughs.jsx globals. */

/* ============================== HEADER STATUS PILL ============================== */
/* The real control: a tinted pill (icon · label · chevron) opening a status
   menu. Here it's driven by your playthroughs but stays manually settable. */
function StatusPill({ status, played, onSelect, interactive = true }) {
  const [open, setOpen] = React.useState(false);
  const s = STATUS[status];
  const label = status === "UP_NEXT" ? upNextLabel(played) : s.label;
  const color = `var(--status-${s.key})`;
  if (!interactive) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: "var(--radius-btn)", fontWeight: 600, fontSize: ".875rem",
        border: `1px solid color-mix(in oklch, ${color} 40%, var(--border))`,
        background: `color-mix(in oklch, ${color} 15%, transparent)`, color: "var(--foreground)" }}>
        <Icon name={s.icon} size={16} style={{ color }} />
        <span>{label}</span>
      </span>
    );
  }
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}
        style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: "var(--radius-btn)", cursor: "pointer", fontWeight: 600, fontSize: ".875rem",
          border: `1px solid color-mix(in oklch, ${color} 40%, var(--border))`,
          background: `color-mix(in oklch, ${color} 15%, transparent)`, color: "var(--foreground)" }}>
        <Icon name={s.icon} size={16} style={{ color }} />
        <span>{label}</span>
        <Icon name="ChevronDown" size={15} style={{ color: "var(--muted-foreground)", transform: open ? "rotate(180deg)" : "none", transition: "transform var(--duration-fast) var(--ease-in-out)" }} />
      </button>
      {open ? (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 20 }} />
          <div role="menu" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 21, width: 230, background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-3)", padding: 6 }}>
            {STATUS_ORDER.map((k) => {
              const e = STATUS[k]; const active = status === k; const c = `var(--status-${e.key})`;
              const lbl = k === "UP_NEXT" ? upNextLabel(played) : e.label;
              return (
                <button key={k} role="menuitemradio" aria-checked={active} onClick={() => { onSelect(k); setOpen(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: "var(--radius-btn)", border: 0, background: "transparent", cursor: "pointer", textAlign: "left", color: "var(--foreground)", fontWeight: active ? 600 : 400, fontSize: ".875rem" }}
                  onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--muted)")}
                  onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}>
                  <span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 9999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: `color-mix(in oklch, ${c} 16%, transparent)` }}>
                    <Icon name={e.icon} size={16} style={{ color: c }} />
                  </span>
                  <span style={{ flex: 1 }}>{lbl}</span>
                  {active ? <Icon name="Check" size={16} style={{ color: "var(--primary)" }} /> : null}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ============================== SCREENSHOTS ============================== */
const SHOT_GRADS = [
  ["#3a5566", "#16242c"], ["#5a3a2c", "#1c120c"], ["#274b52", "#0d1c20"],
  ["#43344f", "#170f1d"], ["#6a3340", "#231016"], ["#2f4636", "#101a12"],
  ["#334a63", "#0e1822"],
];
function ScreenshotsPanel() {
  return (
    <Card variant="flat" className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <span className="terminal-label">{`// SCREENSHOTS`}</span>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        {SHOT_GRADS.map((g, i) => (
          <div key={i} style={{ aspectRatio: "16/9", borderRadius: "var(--radius-md)", overflow: "hidden", position: "relative",
            background: `linear-gradient(150deg, ${g[0]}, ${g[1]})`, border: "1px solid color-mix(in oklch, var(--border) 50%, transparent)" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.32)" }}>
              <Icon name="Image" size={20} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ============================== TIMES TO BEAT ============================== */
function TimesToBeatPanel({ youHours }) {
  const main = FF7R.hltb.main, full = FF7R.hltb.full;
  const max = full * 1.18;
  const pct = (v) => Math.min(100, (v / max) * 100);
  const youPct = pct(youHours);
  const youAtEnd = youHours >= full;
  let copy;
  if (youHours < main) copy = <>You're <b style={{ color: "var(--primary)" }}>{(main - youHours).toFixed(1)}h</b> from the main story — about {(full - youHours).toFixed(1)}h of the long road left to 100%.</>;
  else if (youHours < full) copy = <>Past the main story. <b style={{ color: "var(--primary)" }}>{(full - youHours).toFixed(1)}h</b> of the long road left to 100%.</>;
  else copy = <>You've gone the distance — <b style={{ color: "var(--primary)" }}>{(youHours - full).toFixed(1)}h</b> past the 100% completion mark.</>;

  return (
    <Card variant="flat" className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
      <h2 className="heading-sm" style={{ margin: 0 }}>Times to beat</h2>
      <div style={{ position: "relative", paddingTop: 30, paddingBottom: 40 }}>
        {/* you marker label */}
        <div style={{ position: "absolute", top: 0, left: youAtEnd ? "auto" : `${youPct}%`, right: youAtEnd ? 0 : "auto", transform: youAtEnd ? "none" : "translateX(-50%)", whiteSpace: "nowrap" }}>
          <span className="overline" style={{ color: "var(--primary)", fontWeight: 600 }}>YOU · {youHours}h</span>
        </div>
        {/* track */}
        <div style={{ position: "relative", height: 6, borderRadius: 9999, background: "var(--muted)" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${youPct}%`, background: "var(--primary)", borderRadius: 9999 }} />
          <span style={{ position: "absolute", top: "50%", left: `${youPct}%`, width: 13, height: 13, borderRadius: 9999, background: "var(--primary)", transform: "translate(-50%,-50%)", boxShadow: "0 0 0 3px var(--card)" }} />
          {[main, full].map((v) => (
            <span key={v} style={{ position: "absolute", top: -3, left: `${pct(v)}%`, width: 2, height: 12, background: "var(--muted-foreground)", opacity: .55, transform: "translateX(-50%)" }} />
          ))}
        </div>
        {/* benchmark labels */}
        <div style={{ position: "absolute", bottom: 0, left: `${pct(main)}%`, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
          <p className="overline" style={{ color: "var(--muted-foreground)", margin: 0 }}>MAIN STORY</p>
          <p className="body-sm" style={{ margin: "2px 0 0", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{main}h</p>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: `${pct(full)}%`, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
          <p className="overline" style={{ color: "var(--muted-foreground)", margin: 0 }}>100%</p>
          <p className="body-sm" style={{ margin: "2px 0 0", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{full}h</p>
        </div>
      </div>
      <p className="body-sm" style={{ margin: 0, color: "var(--foreground-body)", lineHeight: 1.6 }}>{copy}</p>
    </Card>
  );
}

/* ============================== ABOUT ============================== */
function AboutPanel({ game }) {
  return (
    <Card variant="flat" className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 22 }}>
      <p className="body-md" style={{ margin: 0, color: "var(--foreground-body)", lineHeight: 1.65, maxWidth: 720 }}>{game.summary}</p>
      <div style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: 16, alignItems: "baseline" }}>
        <span className="terminal-label">{`// GAME.DETAIL`}</span>
        <dl style={{ margin: 0, fontSize: ".875rem", display: "flex", flexDirection: "column", gap: 4 }}>
          {[["Release year", game.year], ["Developer", game.developer], ["Publisher", game.publisher]].map(([t, v]) => (
            <div key={t} style={{ display: "flex", gap: 8 }}>
              <dt style={{ color: "var(--muted-foreground)", width: 96, flexShrink: 0 }}>{t}</dt>
              <dd style={{ margin: 0 }}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  );
}

/* ============================== THEMES / GENRES / PLATFORMS ============================== */
function ThemesTagsPanel({ game }) {
  const Row = ({ label, children }) => (
    <>
      <span className="terminal-label" style={{ paddingTop: 4 }}>{label}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{children}</div>
    </>
  );
  return (
    <Card variant="flat" className="card" style={{ padding: 22, display: "grid", gridTemplateColumns: "max-content 1fr", gap: "16px 16px", alignItems: "baseline" }}>
      <Row label={`// THEMES`}>{game.themes.map((x) => <Badge key={x} variant="secondary" style={{ borderRadius: "var(--radius-md)" }}>{x}</Badge>)}</Row>
      <Row label={`// GENRES`}>{game.genres.map((x) => <Badge key={x} variant="secondary" style={{ borderRadius: "var(--radius-md)" }}>{x}</Badge>)}</Row>
      <Row label={`// PLATFORMS`}>{game.platformList.map((x) => <PlatformPill key={x} platform={x} />)}</Row>
    </Card>
  );
}

/* ============================== JOURNAL FEED ============================== */
/* Chronological feed across every run — the page-level mirror of the entries
   nested in the timeline. Each entry shows which run it belongs to. */
function JournalFeed({ pts, framing, onAdd }) {
  const all = [];
  pts.forEach((p) => p.entries.forEach((e, i) => all.push({ ...e, run: p, order: p.ordinal * 1000 - i })));
  all.sort((a, b) => b.order - a.order);
  return (
    <Card variant="flat" className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 className="heading-sm" style={{ margin: 0 }}>Journal</h2>
        <button className="btn btn-link btn-sm" style={{ height: "auto", padding: 0 }} onClick={onAdd}>Add entry</button>
      </header>
      {all.length === 0 ? (
        <p className="body-sm" style={{ color: "var(--muted-foreground)", margin: 0, fontStyle: "italic" }}>Nothing logged yet.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, maxWidth: 860, display: "flex", flexDirection: "column" }}>
          {all.map((e, i) => (
            <li key={e.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, padding: "14px 0", borderTop: i === 0 ? "none" : "1px solid color-mix(in oklch, var(--border) 55%, transparent)" }}>
              <span aria-hidden="true" style={{ display: "flex", justifyContent: "center", paddingTop: 5 }}>
                <RunMarker status={e.run.status} size={20} ring={false} />
              </span>
              <div style={{ minWidth: 0 }}>
                <p className="overline" style={{ color: "var(--muted-foreground)", margin: 0 }}>
                  {String(e.date).toUpperCase()} · {runLabel(e.run, framing).toUpperCase()} · {e.hours}H
                </p>
                <p className="body-md" style={{ margin: "5px 0 0", color: "var(--foreground-body)", fontStyle: "italic", lineHeight: 1.6, maxWidth: 760 }}>&ldquo;{e.body}&rdquo;</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ============================== RELATED ============================== */
const RELATED = [
  { t: "FF VII Rebirth", from: "#2a4d3a", to: "#0e1c14" },
  { t: "Crisis Core: FF VII", from: "#4a2f5a", to: "#1a1020" },
  { t: "FF VII Remake Intergrade", from: "#27525e", to: "#0a1620" },
  { t: "Final Fantasy VII", from: "#3a3f63", to: "#14182c" },
];
function RelatedGames() {
  return (
    <Card variant="flat" className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 className="heading-sm" style={{ margin: 0 }}>Related games</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {RELATED.map((r) => (
          <div key={r.t} style={{ display: "flex", flexDirection: "column", gap: 8, cursor: "pointer" }}>
            <div className="cover" style={{ background: `linear-gradient(150deg, ${r.from}, ${r.to})` }}>
              <div className="cover-fallback"><span style={{ fontSize: "1.1rem" }}>{r.t.split(" ").filter((w) => /^[A-Z0-9]/.test(w)).slice(0, 2).map((w) => w[0]).join("")}</span></div>
            </div>
            <p className="body-xs" style={{ margin: 0, fontWeight: 500, lineHeight: 1.3 }}>{r.t}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

Object.assign(window, {
  StatusPill, ScreenshotsPanel, TimesToBeatPanel, AboutPanel, ThemesTagsPanel, JournalFeed, RelatedGames,
});
