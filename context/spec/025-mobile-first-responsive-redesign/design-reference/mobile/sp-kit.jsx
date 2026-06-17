/* SavePoint mobile kit — primitives, chrome, sample data.
   Forked from the design-system UI kit (kit.jsx) and extended with
   mobile-first chrome (top bar, bottom nav, sheets, segmented control,
   carousels). Everything exported to window for cross-file Babel sharing. */

/* ============================== ICONS (Lucide) ============================== */
function Icon({ name, size = 20, strokeWidth = 2, className, style }) {
  const lib = (typeof window !== "undefined" && window.lucide && window.lucide.icons) || {};
  const node = lib[name] || lib[toPascal(name)];
  if (!node) return null;
  // lucide UMD global: icons map value IS the children array [[tag, attrs], …].
  // (lucide-react uses [tag, attrs, children]; support both.)
  const children = Array.isArray(node) && typeof node[0] !== "string"
    ? node
    : (Array.isArray(node[2]) ? node[2] : []);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size}
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style} aria-hidden="true">
      {children.map((child, i) => React.createElement(child[0], { ...child[1], key: i }))}
    </svg>
  );
}
function toPascal(s) { return String(s).replace(/(^\w|-\w)/g, (m) => m.replace("-", "").toUpperCase()); }

/* ============================== BRAND ============================== */
function LogoMark({ size = 28, color = "var(--primary)", className }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className}
      fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round"
      style={{ color }} aria-hidden="true">
      <rect x="13.2" y="13.2" width="21.6" height="21.6" rx="4" transform="rotate(45 24 24)" />
      <rect x="19.5" y="19.5" width="9" height="9" rx="1.5" transform="rotate(45 24 24)" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ============================== PRIMITIVES ============================== */
function Button({ variant = "default", size = "default", pill, className = "", children, style, ...props }) {
  const cls = ["btn", `btn-${variant}`, size !== "default" ? `btn-${size}` : "", pill ? "btn-pill" : "", className]
    .filter(Boolean).join(" ");
  return <button className={cls} style={style} {...props}>{children}</button>;
}
function Card({ variant = "default", className = "", children, style, ...props }) {
  const cls = ["card", variant !== "default" ? `card-${variant}` : "", className].filter(Boolean).join(" ");
  return <div className={cls} style={style} {...props}>{children}</div>;
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
const STATUS_ORDER = ["PLAYING", "UP_NEXT", "SHELF", "PLAYED", "WISHLIST"];

function StatusBadge({ status, className = "", style }) {
  const s = STATUS[status];
  if (!s) return null;
  return (
    <span className={`badge badge-status ${className}`}
      style={{ background: `var(--status-${s.key})`, color: `var(--status-${s.key}-foreground)`, ...style }}>
      {s.label}
    </span>
  );
}

const PLATFORM_COLOR = { PC: "#1b2838", PlayStation: "#0070d1", Xbox: "#107c10", Switch: "#e60012" };
function PlatformBadge({ platform }) {
  const c = PLATFORM_COLOR[platform] || "var(--muted-foreground)";
  return (
    <span className="badge" style={{
      background: `color-mix(in oklch, ${c} 14%, transparent)`, color: c, fontWeight: 600,
    }}>{platform}</span>
  );
}

/* ============================== RATING ============================== */
function RatingStars({ value, size = 13 }) {
  if (value == null) return <span className="body-xs" style={{ color: "var(--muted-foreground)", fontStyle: "italic" }}>unrated</span>;
  const stars = value / 2;
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
function GameCover({ game, className = "", style, monoSize = "1.4rem", radius }) {
  return (
    <div className={`cover ${className}`} style={{ ...style, borderRadius: radius, background: `linear-gradient(150deg, ${game.from}, ${game.to})` }}>
      {/* hi-fi texture: diagonal sheen + bottom vignette + hairline inner edge */}
      <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", background: "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, transparent 38%), radial-gradient(120% 80% at 50% 120%, rgba(0,0,0,0.45), transparent 60%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)", pointerEvents: "none" }} />
      <div className="cover-fallback"><span style={{ fontSize: monoSize }}>{coverInitials(game.title)}</span></div>
    </div>
  );
}

/* Critic-score ring — SVG arc, color graded by score */
function CriticRing({ value, size = 56, stroke = 4 }) {
  if (value == null) return null;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const color = value >= 85 ? "var(--success)" : value >= 70 ? "var(--status-upNext)" : value >= 50 ? "var(--warning)" : "var(--destructive)";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="color-mix(in oklch, var(--muted-foreground) 22%, transparent)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: size * 0.34, color: "var(--foreground)", lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: size * 0.13, color: "var(--muted-foreground)", letterSpacing: "0.08em", marginTop: 1 }}>CRITIC</span>
      </div>
    </div>
  );
}

/* ============================== SAMPLE DATA ============================== */
const GAMES = [
  { id: "hk",  title: "Hollow Knight",            dev: "Team Cherry",       year: 2017, platform: "PC",          status: "PLAYING",  rating: 9,  from: "#1f2a44", to: "#0a1020", sessions: 12, hours: 47, progress: 0.68, critic: 90 },
  { id: "had", title: "Hades",                    dev: "Supergiant Games",  year: 2020, platform: "Switch",      status: "PLAYING",  rating: 9,  from: "#7a1f2b", to: "#2a0a12", sessions: 22, hours: 63, progress: 0.42, critic: 93 },
  { id: "sts", title: "Slay the Spire",           dev: "MegaCrit",          year: 2019, platform: "PC",          status: "PLAYING",  rating: null, from: "#5b2333", to: "#2a0e16", sessions: 4, hours: 19, progress: 0.30, critic: 89 },
  { id: "ow",  title: "Outer Wilds",              dev: "Mobius Digital",    year: 2019, platform: "PC",          status: "UP_NEXT",  rating: null, from: "#1b3a4b", to: "#0a1822", critic: 85 },
  { id: "tun", title: "Tunic",                    dev: "Andrew Shouldice",  year: 2022, platform: "Xbox",        status: "UP_NEXT",  rating: null, from: "#2f6d4f", to: "#123524", critic: 85 },
  { id: "de",  title: "Disco Elysium",            dev: "ZA/UM",             year: 2019, platform: "PC",          status: "PLAYED",   rating: 10, from: "#6b4a1f", to: "#241608", hours: 38, critic: 91 },
  { id: "cel", title: "Celeste",                  dev: "Maddy Makes Games", year: 2018, platform: "Switch",      status: "PLAYED",   rating: 9,  from: "#3a4a7a", to: "#15203f", hours: 14, critic: 92 },
  { id: "obra",title: "Return of the Obra Dinn",  dev: "Lucas Pope",        year: 2018, platform: "PC",          status: "PLAYED",   rating: 9,  from: "#4a4636", to: "#1a1812", hours: 9, critic: 89 },
  { id: "jrn", title: "Journey",                  dev: "thatgamecompany",   year: 2012, platform: "PlayStation", status: "PLAYED",   rating: 8,  from: "#9c5a2a", to: "#3a1d0e", hours: 3, critic: 92 },
  { id: "sdv", title: "Stardew Valley",           dev: "ConcernedApe",      year: 2016, platform: "PC",          status: "SHELF",    rating: null, from: "#3f6d2f", to: "#16280f" },
  { id: "ins", title: "Inside",                   dev: "Playdead",          year: 2016, platform: "PC",          status: "SHELF",    rating: null, from: "#33384a", to: "#0d0f16" },
  { id: "pen", title: "Pentiment",                dev: "Obsidian",          year: 2022, platform: "Xbox",        status: "WISHLIST", rating: null, from: "#7a5a2a", to: "#2f2210" },
];
const byId = (id) => GAMES.find((g) => g.id === id);

function statusCounts() {
  const c = { WISHLIST: 0, SHELF: 0, UP_NEXT: 0, PLAYING: 0, PLAYED: 0 };
  GAMES.forEach((g) => { c[g.status]++; });
  return c;
}

const JOURNAL = [
  { id: "j1", gameId: "hk", date: "APR 22", session: 12, hours: 2.5,
    body: "Took five tries on Hornet — finally read the dash pattern. The arena lighting in this fight is unreal. Greenpath keeps unfolding; every dead end turns out to be a door I couldn't open yet." },
  { id: "j2", gameId: "had", date: "APR 19", session: 22, hours: 1.5,
    body: "Cleared it. Forty-odd escapes and the story finally closed the loop. I didn't expect a roguelike to make me care this much about a family." },
  { id: "j3", gameId: "de", date: "APR 11", session: null, hours: 4,
    body: "No combat, no map markers, just a city and a hundred voices in your own head. Spent an hour talking to a mailbox." },
  { id: "j4", gameId: "cel", date: "APR 03", session: null, hours: 1,
    body: "Chapter 6. The mirror sequence hit differently tonight. Mechanics and theme are the same thing here — the climb IS the feeling." },
];

/* ============================== MOBILE CHROME ============================== */

/* Global nav bridge — the interactive prototype sets window.__MNAV; the static
   design-canvas files leave it undefined so taps are harmless no-ops. */
function mnav() {
  return window.__MNAV || { setTab() {}, go() {}, openGame() {}, openSheet() {}, back() {} };
}

/* Sticky top bar — logo + page title + search. 44px touch targets. */
function TopBar({ title, showLogo = false, onBack = false, trailing }) {
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 30,
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 12px", minHeight: 52,
      background: "color-mix(in oklch, var(--background) 86%, transparent)",
      backdropFilter: "blur(12px) saturate(140%)", WebkitBackdropFilter: "blur(12px) saturate(140%)",
      borderBottom: "1px solid color-mix(in oklch, var(--border) 60%, transparent)",
    }}>
      {onBack ? (
        <button aria-label="Back" onClick={() => mnav().back()} style={iconBtn}><Icon name="ChevronLeft" size={22} /></button>
      ) : showLogo ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 4 }}>
          <LogoMark size={26} />
        </div>
      ) : null}
      <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.18rem", letterSpacing: "-0.01em", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {trailing || <button aria-label="Search" style={iconBtn}><Icon name="Search" size={20} /></button>}
      </div>
    </header>
  );
}
const iconBtn = {
  width: 44, height: 44, borderRadius: "var(--radius-btn)", border: "none", background: "transparent",
  color: "var(--foreground)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
};

/* Bottom nav — tweak-driven. props: active, labels, center (raised Log), items count */
const NAV_FULL = [
  { key: "home", label: "Home", icon: "House" },
  { key: "library", label: "Library", icon: "Library" },
  { key: "journal", label: "Journal", icon: "BookOpen" },
  { key: "profile", label: "Profile", icon: "User" },
];
function BottomNav({ active = "home", labels = true, center = true }) {
  // when center=false we render a 5th "Search" tab to keep parity of destinations
  const items = center ? NAV_FULL : [
    NAV_FULL[0], NAV_FULL[1],
    { key: "search", label: "Search", icon: "Search" },
    NAV_FULL[2], NAV_FULL[3],
  ];
  const left = center ? items.slice(0, 2) : items.slice(0, Math.ceil(items.length / 2));
  const right = center ? items.slice(2) : items.slice(Math.ceil(items.length / 2));
  const Tab = ({ it }) => {
    const on = it.key === active;
    return (
      <div onClick={() => (it.key === "search" ? mnav().openSheet("add") : mnav().setTab(it.key))} style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: labels ? 3 : 0, minWidth: 0, color: on ? "var(--foreground)" : "var(--muted-foreground)", cursor: "pointer", padding: "2px 0",
      }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 46, height: on ? (labels ? 26 : 32) : 26, borderRadius: 9999, background: on ? "color-mix(in oklch, var(--primary) 15%, transparent)" : "transparent", transition: "background var(--duration-fast) var(--ease-in-out)" }}>
          <Icon name={it.icon} size={22} strokeWidth={on ? 2.4 : 2} style={{ color: on ? "var(--primary)" : "inherit" }} />
        </div>
        {labels && <span style={{ fontSize: "0.62rem", fontWeight: on ? 600 : 500, letterSpacing: "0.01em" }}>{it.label}</span>}
      </div>
    );
  };
  return (
    <nav style={{
      position: "sticky", bottom: 0, zIndex: 30,
      display: "flex", alignItems: "stretch", gap: 0,
      padding: "8px 8px 26px",
      background: "color-mix(in oklch, var(--card) 90%, transparent)",
      backdropFilter: "blur(14px) saturate(160%)", WebkitBackdropFilter: "blur(14px) saturate(160%)",
      borderTop: "1px solid color-mix(in oklch, var(--border) 70%, transparent)",
    }}>
      {left.map((it) => <Tab key={it.key} it={it} />)}
      {center && (
        <div style={{ flex: "0 0 auto", display: "flex", alignItems: "flex-start", justifyContent: "center", width: 64 }}>
          <button aria-label="Log a session" onClick={() => mnav().openSheet("log")} style={{
            width: 52, height: 52, marginTop: -20, borderRadius: 9999, border: "none",
            background: "var(--primary)", color: "var(--primary-foreground)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            boxShadow: "var(--shadow-3)",
          }}>
            <Icon name="Plus" size={26} strokeWidth={2.4} />
          </button>
        </div>
      )}
      {right.map((it) => <Tab key={it.key} it={it} />)}
    </nav>
  );
}

/* Sticky segmented control — horizontally scrollable status / section row */
function Segmented({ options, value, sticky = true, top = 52, counts }) {
  return (
    <div style={{
      position: sticky ? "sticky" : "static", top, zIndex: 20,
      display: "flex", gap: 7, overflowX: "auto", padding: "10px 14px",
      background: "color-mix(in oklch, var(--background) 88%, transparent)",
      backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
      scrollbarWidth: "none",
    }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} style={{
            flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 6,
            height: 34, padding: "0 14px", borderRadius: 9999, cursor: "pointer",
            border: on ? "1px solid transparent" : "1px solid var(--border)",
            background: on ? "var(--primary)" : "var(--card)",
            color: on ? "var(--primary-foreground)" : "var(--foreground-body)",
            fontSize: "0.82rem", fontWeight: on ? 600 : 500, whiteSpace: "nowrap",
          }}>
            {o.label}
            {counts && counts[o.value] != null && (
              <span style={{ fontSize: "0.72rem", opacity: 0.75, fontVariantNumeric: "tabular-nums" }}>{counts[o.value]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* Section header — // TERMINAL.LABEL + optional action */
function SectionHead({ label, terminal, action }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
      {terminal
        ? <span className="terminal-label">{terminal}</span>
        : <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.15rem", letterSpacing: "-0.01em", color: "var(--foreground)", margin: 0 }}>{label}</h2>}
      {action && <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 2 }}>{action}<Icon name="ChevronRight" size={14} /></span>}
    </div>
  );
}

/* Bottom sheet shell — used for log/compose/add/search flows */
function Sheet({ title, children, footer, grabber = true, height = "auto", dark, keyboard, onClose }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", zIndex: 80 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
      <div style={{
        position: "relative", background: "var(--background)",
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        boxShadow: "var(--shadow-4)", maxHeight: "92%", height,
        display: "flex", flexDirection: "column", overflow: "hidden",
        paddingBottom: keyboard ? 0 : 26,
      }}>
        {grabber && <div style={{ width: 38, height: 5, borderRadius: 9999, background: "var(--border)", margin: "10px auto 4px" }} />}
        {title && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 18px 12px" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.2rem", color: "var(--foreground)", margin: 0, letterSpacing: "-0.01em" }}>{title}</h3>
            <button aria-label="Close" onClick={onClose} style={{ ...iconBtn, width: 34, height: 34, color: "var(--muted-foreground)" }}><Icon name="X" size={20} /></button>
          </div>
        )}
        <div style={{ overflowY: "auto", padding: "0 18px", flex: "1 1 auto" }}>{children}</div>
        {footer && <div style={{ padding: "14px 18px 4px", borderTop: "1px solid color-mix(in oklch, var(--border) 55%, transparent)" }}>{footer}</div>}
      </div>
    </div>
  );
}

/* Field row for forms inside sheets */
function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 7, fontFamily: "var(--font-runtime-mono)" }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: "0.78rem", color: "var(--muted-foreground)", margin: "6px 0 0", fontStyle: "italic" }}>{hint}</p>}
    </div>
  );
}

/* Density helper — returns spacing scale */
function dens(d) {
  return d === "compact"
    ? { pad: 14, gap: 10, cols: 3, cardPad: 12, rail: 96 }
    : { pad: 18, gap: 14, cols: 2, cardPad: 16, rail: 124 };
}

Object.assign(window, {
  Icon, LogoMark, Button, Card, Badge,
  STATUS, STATUS_ORDER, StatusBadge, PlatformBadge, RatingStars, GameCover, coverInitials,
  GAMES, byId, statusCounts, JOURNAL,
  TopBar, BottomNav, Segmented, SectionHead, Sheet, Field, dens, iconBtn, CriticRing, mnav,
});
