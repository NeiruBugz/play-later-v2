/* SavePoint UI Kit — primitives, icon system, brand marks, sample data.
   Exports everything to window for cross-file (Babel) sharing. */

/* ============================== ICONS (Lucide) ============================== */
/* lucide UMD exposes a global `lucide` with an `.icons` map keyed PascalCase,
   each value an IconNode array of [tag, attrs] children. We wrap them in a
   standard lucide <svg>. */
function Icon({ name, size = 16, strokeWidth = 2, className, style }) {
  const lib = (typeof window !== "undefined" && window.lucide && window.lucide.icons) || {};
  const node = lib[name] || lib[toPascal(name)];
  if (!node) return null;
  // lucide UMD node shape: [tag, attrs, childrenArray]; children = [tag, attrs][]
  const children = Array.isArray(node[2]) ? node[2] : [];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg" width={size} height={size}
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style} aria-hidden="true"
    >
      {children.map((child, i) => React.createElement(child[0], { ...child[1], key: i }))}
    </svg>
  );
}
function toPascal(s) {
  return String(s).replace(/(^\w|-\w)/g, (m) => m.replace("-", "").toUpperCase());
}

/* ============================== BRAND ============================== */
/* The SavePoint "Save Glow" logomark — the deliberate save-point marker.
   Drawn with currentColor, so it tints to whatever color the caller sets
   (defaults to the active accent --primary). */
function LogoMark({ size = 32, color = "var(--primary)", className }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className}
      fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round"
      style={{ color }} aria-hidden="true">
      <rect x="13.2" y="13.2" width="21.6" height="21.6" rx="4" transform="rotate(45 24 24)" />
      <rect x="19.5" y="19.5" width="9" height="9" rx="1.5" transform="rotate(45 24 24)" fill="currentColor" stroke="none" />
    </svg>
  );
}
function Wordmark({ size = 32 }) {
  return (
    <span className="sidebar-brand">
      <LogoMark size={size} />
      <span className="heading-sm" style={{ fontWeight: 700 }}>SavePoint</span>
    </span>
  );
}

/* ============================== PRIMITIVES ============================== */
function Button({ variant = "default", size = "default", pill, className = "", children, ...props }) {
  const cls = ["btn", `btn-${variant}`, size !== "default" ? `btn-${size}` : "", pill ? "btn-pill" : "", className]
    .filter(Boolean).join(" ");
  return <button className={cls} {...props}>{children}</button>;
}

function Card({ variant = "default", className = "", children, ...props }) {
  const cls = ["card", variant !== "default" ? `card-${variant}` : "", className].filter(Boolean).join(" ");
  return <div className={cls} {...props}>{children}</div>;
}

function Badge({ variant = "secondary", className = "", children, style }) {
  return <span className={`badge badge-${variant} ${className}`} style={style}>{children}</span>;
}

/* ============================== STATUS SYSTEM ============================== */
const STATUS = {
  WISHLIST: { label: "Wishlist", key: "wishlist", icon: "Bookmark" },
  SHELF:    { label: "Shelf",    key: "shelf",    icon: "Archive" },
  UP_NEXT:  { label: "Up Next",  key: "upNext",   icon: "Star" },
  PLAYING:  { label: "Playing",  key: "playing",  icon: "Gamepad2" },
  PLAYED:   { label: "Played",   key: "played",   icon: "CheckCircle" },
};
const STATUS_ORDER = ["UP_NEXT", "PLAYING", "SHELF", "PLAYED", "WISHLIST"];

function StatusBadge({ status, className = "" }) {
  const s = STATUS[status];
  if (!s) return null;
  return (
    <span
      className={`badge badge-status ${className}`}
      style={{ background: `var(--status-${s.key})`, color: `var(--status-${s.key}-foreground)` }}
    >
      {s.label}
    </span>
  );
}

/* Platform pill — brand-constant colors, tinted background */
const PLATFORM_COLOR = {
  PC: "#1b2838", PlayStation: "#0070d1", Xbox: "#107c10", Switch: "#e60012",
};
function PlatformBadge({ platform }) {
  const c = PLATFORM_COLOR[platform] || "var(--muted-foreground)";
  const dark = document.documentElement.classList.contains("dark");
  const tint = platform === "PC" && dark ? "#66c0f4" : c;
  return (
    <span className="badge" style={{
      background: `color-mix(in oklch, ${tint} 14%, transparent)`,
      color: tint, fontWeight: 600,
    }}>{platform}</span>
  );
}

/* ============================== RATING ============================== */
/* Storage is 1–10; UI shows 5 stars (half-star precision). */
function RatingStars({ value, size = 14 }) {
  if (value == null) return <span className="body-xs" style={{ color: "var(--muted-foreground)", fontStyle: "italic" }}>unrated</span>;
  const stars = value / 2; // 0–5
  return (
    <span style={{ display: "inline-flex", gap: 1 }} aria-label={`${stars} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, stars - i));
        return (
          <span key={i} style={{ position: "relative", width: size, height: size, display: "inline-block" }}>
            <Icon name="Star" size={size} style={{ position: "absolute", color: "var(--muted-foreground)", opacity: .35 }} />
            <span style={{ position: "absolute", overflow: "hidden", width: `${fill * 100}%`, height: size }}>
              <Icon name="Star" size={size} style={{ color: "var(--primary)", fill: "var(--primary)" }} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/* ============================== COVER ============================== */
function coverInitials(title) {
  const stop = new Set(["of", "the", "a", "an", "and"]);
  const words = String(title).split(/\s+/).filter((w) => w && !stop.has(w.toLowerCase()));
  return (words.slice(0, 2).map((w) => w[0]).join("") || "?").toUpperCase();
}
function GameCover({ game, className = "", style, monoSize = "1.6rem" }) {
  return (
    <div className={`cover ${className}`} style={{ ...style, background: `linear-gradient(150deg, ${game.from}, ${game.to})` }}>
      <div className="cover-fallback"><span style={{ fontSize: monoSize }}>{coverInitials(game.title)}</span></div>
    </div>
  );
}

/* ============================== SAMPLE DATA ============================== */
/* Patient-gamer library: thoughtful, atmospheric, slow-burn games. Covers use
   the app's real colored-accent fallback (no external IGDB fetch). */
const GAMES = [
  { id: "hk",  title: "Hollow Knight",            dev: "Team Cherry",       year: 2017, platform: "PC",          status: "PLAYING",  rating: 9,  from: "#1f2a44", to: "#0a1020", sessions: 12, hours: 47 },
  { id: "sts", title: "Slay the Spire",           dev: "MegaCrit",          year: 2019, platform: "PC",          status: "PLAYING",  rating: null, from: "#5b2333", to: "#2a0e16", sessions: 4, hours: 19 },
  { id: "had", title: "Hades",                    dev: "Supergiant Games",  year: 2020, platform: "Switch",      status: "PLAYING",  rating: 9,  from: "#7a1f2b", to: "#2a0a12", sessions: 22, hours: 63 },
  { id: "ow",  title: "Outer Wilds",              dev: "Mobius Digital",    year: 2019, platform: "PC",          status: "UP_NEXT",  rating: null, from: "#1b3a4b", to: "#0a1822" },
  { id: "tun", title: "Tunic",                    dev: "Andrew Shouldice",  year: 2022, platform: "Xbox",        status: "UP_NEXT",  rating: null, from: "#2f6d4f", to: "#123524" },
  { id: "de",  title: "Disco Elysium",            dev: "ZA/UM",             year: 2019, platform: "PC",          status: "PLAYED",   rating: 10, from: "#6b4a1f", to: "#241608" },
  { id: "cel", title: "Celeste",                  dev: "Maddy Makes Games", year: 2018, platform: "Switch",      status: "PLAYED",   rating: 9,  from: "#3a4a7a", to: "#15203f" },
  { id: "obra",title: "Return of the Obra Dinn",  dev: "Lucas Pope",        year: 2018, platform: "PC",          status: "PLAYED",   rating: 9,  from: "#4a4636", to: "#1a1812" },
  { id: "jrn", title: "Journey",                  dev: "thatgamecompany",   year: 2012, platform: "PlayStation", status: "PLAYED",   rating: 8,  from: "#9c5a2a", to: "#3a1d0e" },
  { id: "sdv", title: "Stardew Valley",           dev: "ConcernedApe",      year: 2016, platform: "PC",          status: "SHELF",    rating: null, from: "#3f6d2f", to: "#16280f" },
  { id: "ins", title: "Inside",                   dev: "Playdead",          year: 2016, platform: "PC",          status: "SHELF",    rating: null, from: "#33384a", to: "#0d0f16" },
  { id: "pen", title: "Pentiment",                dev: "Obsidian",          year: 2022, platform: "Xbox",        status: "WISHLIST", rating: null, from: "#7a5a2a", to: "#2f2210" },
];

function statusCounts() {
  const c = { WISHLIST: 0, SHELF: 0, UP_NEXT: 0, PLAYING: 0, PLAYED: 0 };
  GAMES.forEach((g) => { c[g.status]++; });
  return c;
}

const JOURNAL = [
  { id: "j1", gameId: "hk", title: "Hollow Knight", date: "APR 22", session: 12, hours: 2.5,
    body: "Took five tries on Hornet — finally read the dash pattern. The arena lighting in this fight is unreal. Greenpath keeps unfolding; every dead end turns out to be a door I couldn't open yet." },
  { id: "j2", gameId: "had", title: "Hades", date: "APR 19", session: 22, hours: 1.5,
    body: "Cleared it. Forty-odd escapes and the story finally closed the loop. I didn't expect a roguelike to make me care this much about a family. Sitting with it for a night before starting the next pact." },
  { id: "j3", gameId: "de", title: "Disco Elysium", date: "APR 11", session: null, hours: 4,
    body: "No combat, no map markers, just a city and a hundred voices in your own head. Spent an hour talking to a mailbox. Best writing I've read in a game, full stop." },
  { id: "j4", gameId: "cel", title: "Celeste", date: "APR 03", session: null, hours: 1,
    body: "Chapter 6. The mirror sequence hit differently tonight. Mechanics and theme are the same thing here — the climb IS the feeling." },
];

/* expose */
Object.assign(window, {
  Icon, LogoMark, Wordmark, Button, Card, Badge,
  StatusBadge, PlatformBadge, RatingStars, GameCover,
  STATUS, STATUS_ORDER, GAMES, JOURNAL, statusCounts,
});
