/* SavePoint desktop — app shell. Persistent left sidebar (collapsible) whose
   defining move is the rationed primary "Log session" CTA pinned under the
   brand — the desktop translation of the mobile bottom-bar's centered Log verb.
   Plus a content header primitive and a modal shell reused for the Log / Add
   flows. Depends on sp-kit.jsx globals (Icon, LogoMark, Button, GAMES…). */

const { useState, useEffect, useRef } = React;

/* ----------------------------------------------------------------------- */
/* Sidebar                                                                  */
/* ----------------------------------------------------------------------- */
const NAV = [
  { key: "home", label: "Home", icon: "House" },
  { key: "library", label: "Library", icon: "Library" },
  { key: "journal", label: "Journal", icon: "BookOpen" },
];

function SideRow({ icon, label, active, collapsed, onClick, badge, title }) {
  return (
    <button
      className="nav-item"
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      title={collapsed ? (title || label) : undefined}
      style={{
        width: "100%", border: "none", background: active ? "var(--muted)" : "transparent",
        justifyContent: collapsed ? "center" : "flex-start", position: "relative",
      }}
    >
      <Icon name={icon} size={18} strokeWidth={active ? 2.4 : 2}
        style={{ color: active ? "var(--primary)" : "var(--muted-foreground)", flexShrink: 0 }} />
      {!collapsed && <span style={{ flex: 1, textAlign: "left" }}>{label}</span>}
      {!collapsed && badge != null && (
        <span style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{badge}</span>
      )}
    </button>
  );
}

function Sidebar({ route, collapsed, onCollapse, nav }) {
  const counts = statusCounts();
  const total = GAMES.length;
  const W = collapsed ? 76 : 260;
  return (
    <aside className="sidebar" style={{ width: W, transition: "width var(--duration-normal) var(--ease-in-out)", padding: collapsed ? "16px 14px" : "16px 18px", gap: 0 }}>
      {/* brand + collapse */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", marginBottom: 18, minHeight: 32 }}>
        <div className="sidebar-brand" style={{ padding: 0, gap: 9 }}>
          <LogoMark size={26} />
          {!collapsed && <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.01em" }}>SavePoint</span>}
        </div>
        {!collapsed && (
          <button aria-label="Collapse sidebar" onClick={() => onCollapse(true)}
            style={{ ...iconBtn, width: 30, height: 30, color: "var(--muted-foreground)" }}>
            <Icon name="PanelLeftClose" size={18} />
          </button>
        )}
      </div>

      {/* PRIMARY VERB — Log session, always one click away */}
      {collapsed ? (
        <button aria-label="Log a session" title="Log a session" onClick={() => nav.openModal("log")}
          style={{ width: 48, height: 48, margin: "0 auto 14px", borderRadius: "var(--radius-btn)", border: "none",
            background: "var(--primary)", color: "var(--primary-foreground)", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", boxShadow: "var(--shadow-2)" }}>
          <Icon name="BookOpen" size={20} />
        </button>
      ) : (
        <Button onClick={() => nav.openModal("log")} style={{ width: "100%", height: 42, marginBottom: 12, boxShadow: "var(--shadow-2)" }}>
          <Icon name="BookOpen" size={17} /> Log a session
        </Button>
      )}

      {/* search */}
      {collapsed ? (
        <button aria-label="Search" title="Search  ⌘K" onClick={() => nav.openModal("add")}
          style={{ ...iconBtn, width: 48, height: 40, margin: "0 auto 18px", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
          <Icon name="Search" size={17} />
        </button>
      ) : (
        <button className="sidebar-search" onClick={() => nav.openModal("add")} style={{ marginBottom: 20, whiteSpace: "nowrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}><Icon name="Search" size={15} /> Search…</span>
          <kbd>⌘K</kbd>
        </button>
      )}

      {/* nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {!collapsed && <div className="terminal-label" style={{ padding: "2px 12px 8px", fontSize: "0.66rem" }}>// LIBRARY</div>}
        {NAV.map((it) => (
          <SideRow key={it.key} icon={it.icon} label={it.label} active={route === it.key}
            collapsed={collapsed} onClick={() => nav.go(it.key)}
            badge={it.key === "library" ? total : it.key === "journal" ? JOURNAL.length : null} />
        ))}
      </nav>

      {/* status legend (expanded only) — carries the journey taxonomy into the rail */}
      {!collapsed && (
        <div style={{ marginTop: 18, padding: "0 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="terminal-label" style={{ fontSize: "0.66rem" }}>// STATUS</div>
          {STATUS_ORDER.map((k) => (
            <button key={k} onClick={() => nav.go("library", { status: k })}
              style={{ display: "flex", alignItems: "center", gap: 9, border: "none", background: "transparent", padding: "3px 0", cursor: "pointer", color: "var(--foreground-body)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 9999, background: `var(--status-${STATUS[k].key})`, flexShrink: 0 }} />
              <span style={{ fontSize: "0.8rem", flex: 1, textAlign: "left" }}>{STATUS[k].label}</span>
              <span style={{ fontSize: "0.74rem", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{counts[k]}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* footer: profile + settings */}
      <div style={{ borderTop: "1px solid color-mix(in oklch, var(--border) 55%, transparent)", paddingTop: 12, marginTop: 12, display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "flex-start" }}>
        <button aria-label="Profile" onClick={() => nav.go("profile")}
          style={{ width: 34, height: 34, borderRadius: 9999, border: route === "profile" ? "2px solid var(--primary)" : "2px solid transparent", background: "linear-gradient(145deg,#3a4a7a,#7a1f2b)", color: "#fff", fontWeight: 700, fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, padding: 0 }}>A</button>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => nav.go("profile")}>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Alex Rivera</div>
            <div style={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>@patientgamer</div>
          </div>
        )}
        {!collapsed && (
          <button aria-label="Settings" onClick={() => nav.go("settings")}
            style={{ ...iconBtn, width: 32, height: 32, color: route === "settings" ? "var(--primary)" : "var(--muted-foreground)" }}>
            <Icon name="Settings" size={18} />
          </button>
        )}
      </div>

      {collapsed && (
        <button aria-label="Expand sidebar" onClick={() => onCollapse(false)} title="Expand"
          style={{ ...iconBtn, width: 48, height: 36, margin: "12px auto 0", color: "var(--muted-foreground)", border: "1px solid color-mix(in oklch, var(--border) 55%, transparent)" }}>
          <Icon name="PanelLeftOpen" size={18} />
        </button>
      )}
    </aside>
  );
}

/* ----------------------------------------------------------------------- */
/* Content page header (sentence-case title + terminal eyebrow + actions)   */
/* ----------------------------------------------------------------------- */
function PageHeader({ eyebrow, title, sub, actions, maxWidth }) {
  return (
    <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 24, maxWidth }}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div className="terminal-label" style={{ marginBottom: 7 }}>{eyebrow}</div>}
        <h1 className="text-h1" style={{ margin: 0, fontFamily: "var(--font-display)" }}>{title}</h1>
        {sub && <p className="body-sm" style={{ color: "var(--muted-foreground)", margin: "6px 0 0" }}>{sub}</p>}
      </div>
      {actions && <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>{actions}</div>}
    </header>
  );
}

/* Scroll container for a routed page — owns max width + comfortable gutters */
function Page({ children, pad = 40, max = 1160, ref: _r }) {
  return (
    <div data-page style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: max, margin: "0 auto", padding: `36px ${pad}px 72px` }}>{children}</div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Modal shell (desktop dialog) — used by Log session + Add game flows       */
/* ----------------------------------------------------------------------- */
function Modal({ title, eyebrow, children, footer, onClose, width = 540 }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "color-mix(in oklch, var(--foreground) 38%, transparent)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }} />
      <div role="dialog" aria-modal="true" style={{
        position: "relative", width, maxWidth: "100%", maxHeight: "calc(100vh - 48px)",
        display: "flex", flexDirection: "column", overflow: "hidden",
        background: "var(--background)", border: "1px solid color-mix(in oklch, var(--border) 70%, transparent)",
        borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-4)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "20px 24px 14px" }}>
          <div>
            {eyebrow && <div className="terminal-label" style={{ marginBottom: 6 }}>{eyebrow}</div>}
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.4rem", letterSpacing: "-0.01em", margin: 0, color: "var(--foreground)" }}>{title}</h2>
          </div>
          <button aria-label="Close" onClick={onClose} style={{ ...iconBtn, width: 36, height: 36, color: "var(--muted-foreground)" }}><Icon name="X" size={20} /></button>
        </div>
        <div style={{ overflowY: "auto", padding: "4px 24px 8px", flex: "1 1 auto" }}>{children}</div>
        {footer && <div style={{ padding: "16px 24px 20px", borderTop: "1px solid color-mix(in oklch, var(--border) 55%, transparent)", display: "flex", gap: 10, justifyContent: "flex-end" }}>{footer}</div>}
      </div>
    </div>
  );
}

/* Form field — desktop variant of the mobile sheet Field */
function FormField({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontFamily: "var(--font-runtime-mono)", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-foreground)", marginBottom: 8 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: "0.78rem", color: "var(--muted-foreground)", fontStyle: "italic", margin: "7px 0 0" }}>{hint}</p>}
    </div>
  );
}

Object.assign(window, { Sidebar, PageHeader, Page, Modal, FormField, NAV });
