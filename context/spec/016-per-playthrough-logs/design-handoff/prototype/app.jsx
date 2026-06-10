/* SavePoint — Per-Playthrough Logs: page shell, game detail, playthroughs panel,
   status wiring, App (tweaks + drawers + state). Depends on kit.jsx,
   playthroughs.jsx, panels.jsx, drawers.jsx, tweaks-panel.jsx globals. */

/* ============================== SIDEBAR ============================== */
const NAV = [
  { key: "library", label: "Library", icon: "BookMarked" },
  { key: "search", label: "Search games", icon: "Search" },
  { key: "journal", label: "Journal", icon: "BookOpen" },
  { key: "profile", label: "Profile", icon: "User" },
  { key: "settings", label: "Settings", icon: "Settings" },
];
function Sidebar() {
  return (
    <aside className="sidebar">
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 16px 0" }}>
        <Wordmark size={30} />
        <button className="sidebar-search"><span>Search</span><kbd>⌘K</kbd></button>
      </div>
      <nav style={{ marginTop: 16, flex: 1, padding: "0 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((n) => (
          <div key={n.key} className="nav-item" aria-current={n.key === "library" ? "page" : undefined}>
            <Icon name={n.icon} size={16} /> {n.label}
          </div>
        ))}
      </nav>
      <div style={{ marginTop: 8, borderTop: "1px solid var(--border)", padding: 12 }}>
        <div className="nav-item" style={{ gap: 8 }}>
          <span style={{ width: 28, height: 28, borderRadius: 9999, background: "var(--primary)", color: "var(--primary-foreground)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: ".8rem", fontWeight: 600 }}>N</span>
          <span style={{ fontWeight: 400 }}>NeiruBugz</span>
        </div>
      </div>
    </aside>
  );
}

/* ============================== PLAYTHROUGHS PANEL ============================== */
/* Replaces the old "// YOUR RECORD" card: an aggregate summary band over the
   per-playthrough timeline. */
function AggStat({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
      <span className="overline" style={{ color: "var(--muted-foreground)" }}>{label}</span>
      <span style={{ display: "inline-flex", alignItems: "center", minHeight: 24 }}>{children}</span>
    </div>
  );
}
function PlaythroughsPanel({ pts, tweaks, onAdd, onEdit, onLog }) {
  const empty = tweaks.empty || pts.length === 0;
  const total = sumHours(pts), runs = pts.length, best = bestRating(pts);
  const completions = pts.map((p) => p.completion).filter(Boolean);
  const headline = completions.includes("Platinum") ? "Platinum" : (completions[0] || null);

  return (
    <Card variant="flat" className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="terminal-label" style={{ fontSize: ".8rem" }}>{`// PLAYTHROUGHS`}</span>
          {!empty ? <span className="badge badge-secondary" style={{ fontWeight: 600 }}>{runs}</span> : null}
        </div>
        {!empty ? <Button size="sm" onClick={onAdd}><Icon name="Plus" size={14} /> New playthrough</Button> : null}
      </header>

      {empty ? (
        <PlaythroughsEmpty onAdd={onAdd} />
      ) : (
        <>
          {/* aggregate band */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 40px", padding: "4px 0 18px", borderBottom: "1px solid color-mix(in oklch, var(--border) 55%, transparent)" }}>
            <AggStat label="Playtime"><span style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{total}h</span></AggStat>
            <AggStat label="Playthroughs"><span style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, lineHeight: 1 }}>{runs}</span></AggStat>
            <AggStat label="Best rating">{best != null ? <RatingStars value={best} size={15} /> : <span className="body-sm" style={{ color: "var(--muted-foreground)" }}>—</span>}</AggStat>
            {headline ? (
              <AggStat label="Completion">
                <span className="badge" style={{ background: "color-mix(in oklch, var(--status-played) 16%, transparent)", color: "var(--status-played)", fontWeight: 600, gap: 5 }}><Icon name="Trophy" size={12} /> {headline}</span>
              </AggStat>
            ) : null}
          </div>
          <Timeline layout={tweaks.layout} pts={pts} framing={tweaks.framing} onEdit={onEdit} onLog={onLog} onAdd={onAdd} />
        </>
      )}
    </Card>
  );
}

/* ============================== GAME DETAIL ============================== */
function GameDetail({ game, pts, tweaks, status, played, statusInteractive, onSelectStatus, onAdd, onEdit, onLog }) {
  const empty = tweaks.empty || pts.length === 0;
  const eyebrow = ["2020", "SQUARE ENIX", "ROLE-PLAYING (RPG)"];
  const youHours = sumHours(pts);

  return (
    <main style={{ position: "relative" }}>
      <div aria-hidden="true" style={{ position: "absolute", inset: "0 0 auto 0", height: 280, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(150deg, ${game.from}, ${game.to})`, filter: "saturate(.95)" }} />
        <div style={{ position: "absolute", inset: 0, background:
          "linear-gradient(180deg, transparent 0%, color-mix(in oklch, var(--background) 40%, transparent) 55%, var(--background) 90%), linear-gradient(90deg, color-mix(in oklch, var(--background) 60%, transparent) 0%, transparent 45%)" }} />
      </div>

      <div style={{ position: "relative", padding: "0 48px 80px", maxWidth: 1200, margin: "0 auto" }}>
        <nav className="caption" style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 16, color: "var(--muted-foreground)" }}>
          <span>Library</span><span style={{ opacity: .5 }}>/</span>
          <span style={{ color: "var(--foreground)", fontWeight: 500 }}>{game.title}</span>
        </nav>

        <section style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 28, alignItems: "end", paddingTop: 140 }}>
          <div style={{ width: 200 }}><GameCover game={game} monoSize="2.6rem" /></div>
          <div style={{ minWidth: 0, paddingBottom: 6 }}>
            <p className="caption" style={{ display: "flex", flexWrap: "wrap", gap: 8, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--muted-foreground)", marginBottom: 10 }}>
              {eyebrow.map((p, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {i > 0 ? <span style={{ width: 3, height: 3, borderRadius: 9999, background: "var(--muted-foreground)" }} /> : null}{p}
                </span>
              ))}
            </p>
            <h1 className="text-h1" style={{ margin: "0 0 16px" }}>{game.title}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <StatusPill status={status} played={played} onSelect={onSelectStatus} interactive={statusInteractive} />
              {!empty ? (
                <span className="caption" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--muted-foreground)" }}>
                  <Icon name="GitBranch" size={13} /> Follows your playthroughs
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <div style={{ marginTop: 28 }}><ScreenshotsPanel /></div>

        {/* bento */}
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <PlaythroughsPanel pts={pts} tweaks={tweaks} onAdd={onAdd} onEdit={onEdit} onLog={onLog} />
            <AboutPanel game={game} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <TimesToBeatPanel youHours={youHours} />
            <ThemesTagsPanel game={game} />
            <RelatedGames />
          </div>
        </div>

        {!empty ? (
          <div style={{ marginTop: 16 }}>
            <JournalFeed pts={pts} framing={tweaks.framing} onAdd={onAdd} />
          </div>
        ) : null}
      </div>
    </main>
  );
}

/* ============================== APP ============================== */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layout": "spine",
  "framing": "journey",
  "dark": false,
  "accent": "#468b85",
  "empty": false
}/*EDITMODE-END*/;

const HEX_TO_ACCENT = { "#468b85": "sage", "#5a52d6": "indigo", "#b3623f": "clay", "#9c4f86": "plum" };

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [pts, setPts] = React.useState(SEED_PLAYTHROUGHS);
  const [emptyManual, setEmptyManual] = React.useState("SHELF");
  const [drawer, setDrawer] = React.useState(null);
  const submitRef = React.useRef({});

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", !!t.dark);
    document.documentElement.setAttribute("data-accent", HEX_TO_ACCENT[t.accent] || "sage");
  }, [t.dark, t.accent]);

  // Library status is purely run-derived. With no runs, the manual pre-play
  // status (Wishlist / Shelf / Up Next) stands.
  const effectivePts = t.empty ? [] : pts;
  const liveStatus = effectivePts.length === 0 ? emptyManual : deriveStatus(effectivePts, emptyManual);
  const played = hasBeenPlayed(effectivePts);

  const close = () => setDrawer(null);
  const openAdd = () => setDrawer({ kind: "add" });
  const openEdit = (pt) => setDrawer({ kind: "edit", pt });
  const openLog = (pt) => setDrawer({ kind: "log", pt });

  const savePlaythrough = (data) => {
    let next;
    if (data.id) {
      next = pts.map((p) => (p.id === data.id ? { ...p, ...data } : p));
    } else {
      const ordinal = (pts.reduce((m, p) => Math.max(m, p.ordinal), 0) || 0) + 1;
      next = [{ ...data, id: `pt${Date.now()}`, ordinal, entries: [] }, ...pts];
    }
    setPts(next);
    close();
  };
  const saveSession = ({ ptId, date, hours, body }) => {
    const next = pts.map((p) => p.id === ptId
      ? { ...p, entries: [{ id: `e${Date.now()}`, date, hours, body: body || "(playtime logged)" }, ...p.entries], hours: p.hours + hours }
      : p);
    setPts(next);
    close();
  };
  const selectStatus = (k) => setEmptyManual(k); // only reachable pre-play (no runs)

  const isFirst = !pts.some((p) => p.kind === "first");

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <GameDetail game={FF7R} pts={effectivePts} tweaks={t} status={liveStatus} played={played}
          statusInteractive={effectivePts.length === 0}
          onSelectStatus={selectStatus} onAdd={openAdd} onEdit={openEdit} onLog={openLog} />
      </main>

      <Drawer open={drawer?.kind === "add" || drawer?.kind === "edit"} onClose={close}
        eyebrow={drawer?.kind === "edit" ? "// EDIT PLAYTHROUGH" : "// NEW PLAYTHROUGH"}
        title={drawer?.kind === "edit" ? "Edit playthrough" : "Log a playthrough"}
        footer={<>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button onClick={() => submitRef.current.submit && submitRef.current.submit()}>
            <Icon name="Check" size={16} /> {drawer?.kind === "edit" ? "Save changes" : "Add playthrough"}
          </Button>
        </>}>
        {(drawer?.kind === "add" || drawer?.kind === "edit") ? (
          <AddEditPlaythroughForm key={drawer.pt?.id || "new"} initial={drawer.pt || null} isFirst={isFirst}
            framing={t.framing} onSave={savePlaythrough} submitRef={submitRef} />
        ) : null}
      </Drawer>

      <Drawer open={drawer?.kind === "log"} onClose={close}
        eyebrow="// LOG SESSION" title="Log a session"
        footer={<>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button onClick={() => submitRef.current.submit && submitRef.current.submit()}>
            <Icon name="Plus" size={16} /> Add entry
          </Button>
        </>}>
        {drawer?.kind === "log" ? (
          <LogSessionForm key={drawer.pt?.id || "log"} playthroughs={pts} targetId={drawer.pt?.id} framing={t.framing}
            onSave={saveSession} submitRef={submitRef} />
        ) : null}
      </Drawer>

      <TweaksPanel>
        <TweakSection label="Timeline" />
        <TweakRadio label="Layout" value={t.layout} options={["spine", "cards", "compact"]} onChange={(v) => setTweak("layout", v)} />
        <TweakSection label="Copy" />
        <TweakRadio label="Run framing" value={t.framing}
          options={[{ value: "journey", label: "Journey" }, { value: "numbered", label: "Numbered" }, { value: "neutral", label: "Neutral" }]}
          onChange={(v) => setTweak("framing", v)} />
        <TweakSection label="Theme" />
        <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak("dark", v)} />
        <TweakColor label="Accent" value={t.accent}
          options={["#468b85", "#5a52d6", "#b3623f", "#9c4f86"]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="State" />
        <TweakToggle label="Empty state" value={t.empty} onChange={(v) => setTweak("empty", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
