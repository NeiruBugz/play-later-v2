/* SavePoint — Per-Playthrough Logs.
   Data, the playthrough timeline (3 layouts), nested journal, rating input,
   the save-glow run marker, and the empty state. Depends on kit.jsx globals. */

/* ============================== GAME ============================== */
const FF7R = {
  id: "ff7r",
  title: "Final Fantasy VII Remake",
  developer: "Square Enix Creative Business Unit I",
  publisher: "Square Enix",
  year: 2020,
  themes: ["Action", "Fantasy", "Science fiction"],
  genres: ["Role-playing (RPG)", "Adventure"],
  platformList: ["Xbox", "PS4", "Switch", "PC"],
  hltb: { main: 38.5, full: 60.4 },
  status: "PLAYED",
  from: "#27525e",
  to: "#0a1620",
  summary:
    "A modern reimagining of one of the most iconic RPGs of all time. The escape from Midgar is retold at a scale the original could only gesture at — every slum alley and reactor catwalk given room to breathe as Cloud and Avalanche strike at the Shinra Electric Power Company.",
};

/* ============================== RUN STATUS ============================== */
/* Per-run lifecycle — distinct from the library journey status. */
const RUN_STATUS = {
  PLAYING:   { label: "Playing",   key: "playing", icon: "Gamepad2",    color: "var(--status-playing)", fg: "var(--status-playing-foreground)" },
  FINISHED:  { label: "Finished",  key: "played",  icon: "CheckCircle", color: "var(--status-played)",  fg: "var(--status-played-foreground)" },
  ABANDONED: { label: "Abandoned", key: "shelf",   icon: "Archive",     color: "var(--status-shelf)",   fg: "var(--status-shelf-foreground)" },
};

/* ============================== PLATFORMS ============================== */
const PLATFORM = {
  PS5:    { label: "PS5",    color: "#0070d1", dark: "#5aa6e8" },
  PS4:    { label: "PS4",    color: "#0070d1", dark: "#5aa6e8" },
  PC:     { label: "PC",     color: "#1b2838", dark: "#66c0f4" },
  Xbox:   { label: "Xbox",   color: "#107c10", dark: "#5bbf5b" },
  Switch: { label: "Switch", color: "#e60012", dark: "#ff5a6a" },
};
const PLATFORM_KEYS = ["PS5", "PS4", "PC", "Xbox", "Switch"];

function PlatformPill({ platform, size = "sm" }) {
  const p = PLATFORM[platform] || { label: platform, color: "var(--muted-foreground)", dark: "var(--muted-foreground)" };
  const isDark = document.documentElement.classList.contains("dark");
  const tint = isDark ? p.dark : p.color;
  return (
    <span className="badge" style={{
      background: `color-mix(in oklch, ${tint} 15%, transparent)`,
      color: tint, fontWeight: 600,
      fontSize: size === "xs" ? ".6875rem" : ".75rem",
      padding: size === "xs" ? "1px 7px" : "2px 8px",
    }}>{p.label}</span>
  );
}

/* ============================== SAMPLE PLAYTHROUGHS ============================== */
/* Newest first (matches the journal convention). */
const SEED_PLAYTHROUGHS = [
  {
    id: "pt2", ordinal: 2, kind: "replay",
    platform: "PS5", status: "FINISHED",
    start: "Jun 12, 2021", end: "Aug 3, 2021",
    hours: 55, rating: 10, completion: "Platinum",
    notes:
      "Hard mode from the first reactor. No items, every classic boss re-tuned into a real fight — Pride & Joy took most of a weekend. The combat finally clicked as a system, not a spectacle.",
    entries: [
      { id: "e21", date: "AUG 3", hours: 3, body: "Pride & Joy down. Platinum. The Hell House on hard is the single best fight in the game and I will not be taking questions." },
      { id: "e22", date: "Jul 10", hours: 2, body: "Chapter 17 again, hard mode. Whittling Hojo's specimens down with pure ATB management. Slower, meaner, better." },
    ],
  },
  {
    id: "pt1", ordinal: 1, kind: "first",
    platform: "PS4", status: "FINISHED",
    start: "Apr 10, 2020", end: "May 28, 2020",
    hours: 42, rating: 9, completion: "Story complete",
    notes:
      "Midgar like I'd never seen it — every alley and slum given room to breathe. Took the story slow; the Wall Market detour alone was worth the price of admission.",
    entries: [
      { id: "e11", date: "May 28", hours: 2.5, body: "Finished. That final highway and the leap into the unknown — I sat through the whole credits. Not ready to leave." },
      { id: "e12", date: "Apr 22", hours: 1.5, body: "Wall Market. The dress, the arena, the absurd glorious spectacle of it. No game commits to a detour like this one." },
      { id: "e13", date: "Apr 10", hours: 2, body: "Bombing run. The reactor falls and the score swells and I'm seventeen again. Hello, old friend." },
    ],
  },
];

/* ============================== HELPERS ============================== */
function runLabel(pt, framing) {
  if (framing === "numbered") return `Playthrough ${pt.ordinal}`;
  if (framing === "neutral") return `Run ${String(pt.ordinal).padStart(2, "0")}`;
  return pt.kind === "first" ? "First playthrough" : "Replay";
}
function runLabelMono(framing) { return framing === "neutral"; }

function sumHours(pts) { return pts.reduce((a, p) => a + (p.hours || 0), 0); }
function totalEntries(pts) { return pts.reduce((a, p) => a + p.entries.length, 0); }
function bestRating(pts) {
  const rated = pts.filter((p) => p.rating != null).map((p) => p.rating);
  return rated.length ? Math.max(...rated) : null;
}

/* Library status rolls up from the playthroughs: an active run means you're
   Playing; otherwise a finished/abandoned run means you've Played it. With no
   runs, the manually-set pre-play status stands. */
function hasBeenPlayed(pts) { return pts.some((p) => p.status === "FINISHED" || p.status === "ABANDONED"); }
function deriveStatus(pts, manual) {
  if (pts.length === 0) return manual;
  if (pts.some((p) => p.status === "PLAYING")) return "PLAYING";
  if (pts.some((p) => p.status === "FINISHED")) return "PLAYED";
  return "PLAYED";
}
function upNextLabel(played) { return played ? "Replay" : "Up Next"; }

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/* ============================== SAVE-GLOW RUN MARKER ============================== */
/* The brand "Save Glow" diamond as the timeline node — each run is a save point. */
function RunMarker({ status, size = 30, ring = true }) {
  const c = RUN_STATUS[status].color;
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {ring ? (
        <span aria-hidden="true" style={{ position: "absolute", inset: -5, borderRadius: 9999,
          background: `color-mix(in oklch, ${c} 14%, transparent)` }} />
      ) : null}
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none" stroke={c} strokeWidth="3" strokeLinejoin="round" style={{ color: c, position: "relative" }} aria-hidden="true">
        <rect x="13.2" y="13.2" width="21.6" height="21.6" rx="4" transform="rotate(45 24 24)" fill="var(--card)" />
        <rect x="19.5" y="19.5" width="9" height="9" rx="1.5" transform="rotate(45 24 24)" fill={c} stroke="none" />
      </svg>
    </span>
  );
}

function RunStatusBadge({ status }) {
  const s = RUN_STATUS[status];
  return (
    <span className="badge" style={{ background: `color-mix(in oklch, ${s.color} 15%, transparent)`, color: s.color, fontWeight: 600, gap: 5, fontSize: ".6875rem", padding: "2px 8px" }}>
      <Icon name={s.icon} size={11} strokeWidth={2.25} /> {s.label}
    </span>
  );
}

/* ============================== INTERACTIVE RATING ============================== */
/* Storage 1–10, shown as 5 stars with half-star precision. Click left/right
   half of a star to pick. */
function RatingInput({ value, onChange, size = 22 }) {
  const [hover, setHover] = React.useState(null);
  const shown = hover != null ? hover : (value ?? 0);
  const stars = shown / 2;
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }} onMouseLeave={() => setHover(null)}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, stars - i));
        return (
          <span key={i} style={{ position: "relative", width: size, height: size, display: "inline-block", cursor: "pointer" }}>
            <Icon name="Star" size={size} style={{ position: "absolute", color: "var(--muted-foreground)", opacity: .3 }} />
            <span style={{ position: "absolute", overflow: "hidden", width: `${fill * 100}%`, height: size }}>
              <Icon name="Star" size={size} style={{ color: "var(--primary)", fill: "var(--primary)" }} />
            </span>
            <span onMouseEnter={() => setHover(i * 2 + 1)} onClick={() => onChange(i * 2 + 1)}
              style={{ position: "absolute", left: 0, top: 0, width: "50%", height: "100%" }} />
            <span onMouseEnter={() => setHover(i * 2 + 2)} onClick={() => onChange(i * 2 + 2)}
              style={{ position: "absolute", right: 0, top: 0, width: "50%", height: "100%" }} />
          </span>
        );
      })}
      <span className="body-sm" style={{ marginLeft: 8, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums", minWidth: 56 }}>
        {value != null ? <><span style={{ color: "var(--foreground)", fontWeight: 600 }}>{(value / 2).toFixed(1)}</span> / 5</> : "unrated"}
      </span>
    </span>
  );
}

/* ============================== NESTED JOURNAL ============================== */
function NestedJournal({ entries, onLog, framing }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="terminal-label" style={{ whiteSpace: "nowrap" }}>{`// JOURNAL · ${entries.length}`}</span>
        <button className="btn btn-ghost btn-sm" style={{ height: 26, padding: "0 8px", fontSize: ".7rem" }} onClick={onLog}>
          <Icon name="Plus" size={12} /> Log session
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="body-xs" style={{ color: "var(--muted-foreground)", fontStyle: "italic", margin: 0 }}>
          No entries on this run yet — playtime is enough, thoughts are optional.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {entries.map((e) => (
            <li key={e.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12 }}>
              <span aria-hidden="true" style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: 9999, background: "var(--primary)", opacity: .8 }} />
              </span>
              <div style={{ minWidth: 0 }}>
                <p className="overline" style={{ color: "var(--muted-foreground)", margin: 0 }}>{e.date.toUpperCase()} · {e.hours}H</p>
                <p className="body-sm" style={{ margin: "3px 0 0", color: "var(--foreground-body)", fontStyle: "italic", lineHeight: 1.55 }}>
                  &ldquo;{e.body}&rdquo;
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ============================== ONE RUN — BODY ============================== */
function RunMeta({ pt }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 12px" }}>
      <PlatformPill platform={pt.platform} />
      <span className="body-sm" style={{ color: "var(--muted-foreground)", display: "inline-flex", alignItems: "center", gap: 7 }}>
        <Icon name="CalendarDays" size={13} />
        {pt.start}{pt.end ? <span style={{ opacity: .6 }}>→</span> : null}{pt.end || <em style={{ fontStyle: "normal", color: "var(--primary)" }}>in progress</em>}
      </span>
      <span style={{ width: 3, height: 3, borderRadius: 9999, background: "var(--muted-foreground)", opacity: .5 }} />
      <span className="body-sm" style={{ color: "var(--muted-foreground)", display: "inline-flex", alignItems: "center", gap: 6 }}>
        <Icon name="Clock" size={13} /> <span style={{ color: "var(--foreground)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{pt.hours}h</span>
      </span>
      {pt.completion ? (
        <>
          <span style={{ width: 3, height: 3, borderRadius: 9999, background: "var(--muted-foreground)", opacity: .5 }} />
          <span className="body-sm" style={{ color: "var(--muted-foreground)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="Trophy" size={13} /> {pt.completion}
          </span>
        </>
      ) : null}
    </div>
  );
}

function RunHeader({ pt, framing, showMarker }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        {showMarker ? <RunMarker status={pt.status} size={26} ring={false} /> : null}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span className={runLabelMono(framing) ? "terminal-label" : "overline"}
            style={{ color: "var(--foreground)", fontWeight: 600, letterSpacing: runLabelMono(framing) ? ".05em" : ".1em", fontSize: runLabelMono(framing) ? ".8rem" : ".75rem" }}>
            {runLabel(pt, framing)}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <RatingStars value={pt.rating} size={14} />
        <RunStatusBadge status={pt.status} />
      </div>
    </div>
  );
}

function RunActions({ pt, onEdit, onLog }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <button className="btn btn-ghost btn-sm" style={{ height: 30, padding: "0 10px", fontSize: ".75rem" }} onClick={onEdit}>
        <Icon name="Pencil" size={13} /> Edit
      </button>
    </div>
  );
}

/* ============================== TIMELINE — SPINE ============================== */
function SpineTimeline({ pts, framing, onEdit, onLog, onAdd }) {
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, position: "relative" }}>
      {pts.map((pt, i) => (
        <li key={pt.id} style={{ display: "grid", gridTemplateColumns: "30px 1fr", gap: 18, position: "relative" }}>
          <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
            <span aria-hidden="true" style={{ position: "absolute", top: 30, bottom: -2, left: "50%", width: 2, transform: "translateX(-50%)",
              background: "linear-gradient(var(--border), var(--border))" }} />
            <RunMarker status={pt.status} size={30} />
          </div>
          <div style={{ paddingBottom: 28, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            <RunHeader pt={pt} framing={framing} showMarker={false} />
            <RunMeta pt={pt} />
            {pt.notes ? (
              <p className="body-md" style={{ margin: 0, color: "var(--foreground-body)", lineHeight: 1.6, maxWidth: 600 }}>{pt.notes}</p>
            ) : null}
            <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 16, marginTop: 2 }}>
              <NestedJournal entries={pt.entries} onLog={() => onLog(pt)} framing={framing} />
            </div>
            <div style={{ marginTop: -2 }}><RunActions pt={pt} onEdit={() => onEdit(pt)} onLog={() => onLog(pt)} /></div>
          </div>
        </li>
      ))}
      {/* add node */}
      <li style={{ display: "grid", gridTemplateColumns: "30px 1fr", gap: 18 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <span style={{ width: 14, height: 14, borderRadius: 9999, border: "2px dashed var(--border)", marginTop: 6 }} />
        </div>
        <button onClick={onAdd} className="body-sm" style={{ textAlign: "left", background: "transparent", border: "1px dashed var(--border)", borderRadius: "var(--radius-card)", padding: "12px 16px", color: "var(--muted-foreground)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all var(--duration-fast) var(--ease-in-out)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--foreground)"; e.currentTarget.style.borderColor = "color-mix(in oklch, var(--border) 80%, var(--foreground))"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted-foreground)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
          <Icon name="Plus" size={15} /> Start a new playthrough
        </button>
      </li>
    </ol>
  );
}

/* ============================== TIMELINE — CARDS ============================== */
function CardsTimeline({ pts, framing, onEdit, onLog, onAdd }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {pts.map((pt) => (
        <Card key={pt.id} className="card-elevated" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, borderLeft: `3px solid ${RUN_STATUS[pt.status].color}` }}>
          <RunHeader pt={pt} framing={framing} showMarker={true} />
          <RunMeta pt={pt} />
          {pt.notes ? (
            <p className="body-md" style={{ margin: 0, color: "var(--foreground-body)", lineHeight: 1.6 }}>{pt.notes}</p>
          ) : null}
          <hr className="divider" style={{ margin: "2px 0" }} />
          <NestedJournal entries={pt.entries} onLog={() => onLog(pt)} framing={framing} />
          <div style={{ display: "flex", justifyContent: "flex-end" }}><RunActions pt={pt} onEdit={() => onEdit(pt)} onLog={() => onLog(pt)} /></div>
        </Card>
      ))}
      <button onClick={onAdd} className="body-sm" style={{ background: "transparent", border: "1px dashed var(--border)", borderRadius: "var(--radius-card)", padding: "14px 16px", color: "var(--muted-foreground)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Icon name="Plus" size={15} /> Start a new playthrough
      </button>
    </div>
  );
}

/* ============================== TIMELINE — COMPACT ============================== */
function CompactRow({ pt, framing, onEdit, onLog, open, onToggle }) {
  return (
    <div style={{ borderBottom: "1px solid color-mix(in oklch, var(--border) 60%, transparent)" }}>
      <button onClick={onToggle} style={{ width: "100%", background: "transparent", border: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, padding: "14px 4px", textAlign: "left", color: "inherit" }}>
        <RunMarker status={pt.status} size={26} ring={false} />
        <span className={runLabelMono(framing) ? "terminal-label" : "overline"} style={{ color: "var(--foreground)", fontWeight: 600, minWidth: 132, fontSize: runLabelMono(framing) ? ".78rem" : ".75rem" }}>
          {runLabel(pt, framing)}
        </span>
        <span className="body-sm" style={{ color: "var(--muted-foreground)", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {pt.start} → {pt.end || "now"}
        </span>
        <PlatformPill platform={pt.platform} size="xs" />
        <span style={{ display: "inline-flex" }}><RatingStars value={pt.rating} size={12} /></span>
        <span className="body-sm" style={{ color: "var(--foreground)", fontWeight: 600, fontVariantNumeric: "tabular-nums", width: 42, textAlign: "right" }}>{pt.hours}h</span>
        <Icon name="ChevronDown" size={16} style={{ color: "var(--muted-foreground)", transform: open ? "rotate(180deg)" : "none", transition: "transform var(--duration-fast) var(--ease-in-out)" }} />
      </button>
      {open ? (
        <div style={{ padding: "0 4px 18px 40px", display: "flex", flexDirection: "column", gap: 14 }}>
          {pt.notes ? <p className="body-md" style={{ margin: 0, color: "var(--foreground-body)", lineHeight: 1.6, maxWidth: 600 }}>{pt.notes}</p> : null}
          <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 16 }}>
            <NestedJournal entries={pt.entries} onLog={() => onLog(pt)} framing={framing} />
          </div>
          <div><RunActions pt={pt} onEdit={() => onEdit(pt)} onLog={() => onLog(pt)} /></div>
        </div>
      ) : null}
    </div>
  );
}
function CompactTimeline({ pts, framing, onEdit, onLog, onAdd }) {
  const [openId, setOpenId] = React.useState(pts[0]?.id);
  return (
    <div>
      <div style={{ borderTop: "1px solid color-mix(in oklch, var(--border) 60%, transparent)" }}>
        {pts.map((pt) => (
          <CompactRow key={pt.id} pt={pt} framing={framing} onEdit={onEdit} onLog={onLog}
            open={openId === pt.id} onToggle={() => setOpenId(openId === pt.id ? null : pt.id)} />
        ))}
      </div>
      <button onClick={onAdd} className="btn btn-outline btn-sm" style={{ marginTop: 14 }}>
        <Icon name="Plus" size={14} /> New playthrough
      </button>
    </div>
  );
}

/* ============================== TIMELINE SWITCH ============================== */
function Timeline({ layout, ...rest }) {
  if (layout === "cards") return <CardsTimeline {...rest} />;
  if (layout === "compact") return <CompactTimeline {...rest} />;
  return <SpineTimeline {...rest} />;
}

/* ============================== EMPTY STATE ============================== */
function PlaythroughsEmpty({ onAdd }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 24px", border: "1px dashed var(--border)", borderRadius: "var(--radius-card)", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <span style={{ opacity: .5 }}><LogoMark size={40} color="var(--muted-foreground)" /></span>
      <div>
        <h3 className="heading-xs" style={{ margin: "0 0 6px" }}>No playthroughs yet</h3>
        <p className="body-sm" style={{ color: "var(--muted-foreground)", margin: 0, maxWidth: 380 }}>
          Every run you start shows up here — dates, platform, and how it went. Reflections can come later.
        </p>
      </div>
      <Button onClick={onAdd}><Icon name="Plus" size={16} /> Log your first playthrough</Button>
    </div>
  );
}

Object.assign(window, {
  FF7R, RUN_STATUS, PLATFORM, PLATFORM_KEYS, PlatformPill,
  SEED_PLAYTHROUGHS, runLabel, runLabelMono, sumHours, totalEntries, bestRating, fmtDate,
  hasBeenPlayed, deriveStatus, upNextLabel,
  RunMarker, RunStatusBadge, RatingInput, NestedJournal,
  Timeline, PlaythroughsEmpty,
});
