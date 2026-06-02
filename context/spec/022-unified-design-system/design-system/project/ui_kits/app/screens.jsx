/* SavePoint UI Kit — composite screens. Recreations of the real product
   surfaces (landing, dashboard, library, game detail, journal). Static/fake
   interactions only. Depends on kit.jsx globals. */

const nav = () => window.SP_NAV || { go() {}, openGame() {} };

/* ============================== LIBRARY ITEM CARD ============================== */
function LibraryItemCard({ item }) {
  return (
    <div style={{ cursor: "pointer" }} onClick={() => nav().openGame(item.id)}>
      <div style={{ position: "relative" }}>
        <GameCover game={item} />
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <StatusBadge status={item.status} />
        </div>
      </div>
      <h3 className="body-sm" style={{ margin: "8px 0 2px", fontWeight: 600, lineHeight: 1.25,
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: "2.5em" }}>
        {item.title}
      </h3>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
        <PlatformBadge platform={item.platform} />
      </div>
      <div style={{ marginTop: 6 }}><RatingStars value={item.rating} /></div>
    </div>
  );
}

/* ============================== GAME SECTION ============================== */
function GameSection({ title, items, viewAllLabel = "View All", hero }) {
  const cols = hero ? "repeat(4, 1fr)" : "repeat(6, 1fr)";
  return (
    <Card className="card-elevated" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 className="body-sm" style={{ fontWeight: 600, margin: 0 }}>{title}</h2>
        <Button variant="ghost" size="sm" className="body-xs" style={{ height: "auto", padding: 0 }}>
          {viewAllLabel} <Icon name="ChevronRight" size={12} />
        </Button>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12 }}>
        {items.map((g) => <LibraryItemCard key={g.id} item={g} />)}
      </div>
    </Card>
  );
}

/* ============================== DASHBOARD ============================== */
function DashboardScreen() {
  const playing = GAMES.filter((g) => g.status === "PLAYING");
  const upNext = GAMES.filter((g) => g.status === "UP_NEXT");
  const counts = statusCounts();
  const total = STATUS_ORDER.reduce((a, k) => a + counts[k], 0);

  return (
    <div className="container">
      {/* Quick log hero */}
      <section className="card" style={{ background: "color-mix(in oklch, var(--card) 60%, transparent)", padding: 24, marginBottom: 16 }}>
        <header style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
          <div>
            <h1 className="text-h2" style={{ margin: 0 }}>What did you play, Alex?</h1>
            <p className="body-sm" style={{ color: "var(--muted-foreground)", marginTop: 4 }}>
              Log tonight's session — playtime is enough, thoughts are optional.
            </p>
          </div>
        </header>
        <ul style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, listStyle: "none", margin: 0, padding: 0 }}>
          {playing.map((g) => (
            <li key={g.id} className="card" style={{ display: "flex", alignItems: "center", gap: 16, padding: 12,
              background: "color-mix(in oklch, var(--background) 50%, transparent)" }}>
              <div style={{ width: 48, flexShrink: 0 }}><GameCover game={g} monoSize="0.8rem" /></div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="body-sm" style={{ fontWeight: 600, cursor: "pointer" }} onClick={() => nav().openGame(g.id)}>{g.title}</div>
                <Button size="sm" style={{ height: 28, padding: "0 8px", marginTop: 8 }} className="body-xs">
                  <Icon name="Plus" size={12} /> Log Session
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {/* Stats card */}
        <div onClick={() => nav().go("library")} className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, cursor: "pointer" }}>
          <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Icon name="Library" size={20} style={{ color: "var(--muted-foreground)" }} />
            <span className="body-sm terminal-label" style={{ fontWeight: 500 }}>// LIBRARY</span>
          </header>
          <div>
            <p style={{ fontSize: "3rem", fontWeight: 700, fontVariantNumeric: "tabular-nums", margin: 0, lineHeight: 1 }}>{total}</p>
            <p className="body-sm" style={{ color: "var(--muted-foreground)", marginTop: 4 }}>Total Games</p>
          </div>
          <div style={{ display: "flex", height: 10, overflow: "hidden", borderRadius: 9999 }}>
            {STATUS_ORDER.map((k) => counts[k] > 0 ? (
              <div key={k} style={{ width: `${(counts[k] / total) * 100}%`, background: `var(--status-${STATUS[k].key})` }} />
            ) : null)}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
            {STATUS_ORDER.map((k) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 9999, background: `var(--status-${STATUS[k].key})` }} />
                <span className="body-xs" style={{ color: "var(--muted-foreground)" }}>
                  {STATUS[k].label} <span style={{ color: "var(--foreground)", fontWeight: 500 }}>{counts[k]}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Up Next + Playing column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <GameSection title="Playing" items={playing} viewAllLabel="View All Playing" hero />
          <GameSection title="Up Next" items={upNext} viewAllLabel="View All Up Next" hero />
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <GameSection title="Recently Added" items={GAMES.slice(0, 6)} viewAllLabel="View Library" />
      </div>
    </div>
  );
}

/* ============================== LIBRARY ============================== */
function LibraryScreen() {
  const [filter, setFilter] = React.useState("ALL");
  const counts = statusCounts();
  const items = filter === "ALL" ? GAMES : GAMES.filter((g) => g.status === filter);
  const chips = ["ALL", ...STATUS_ORDER];

  return (
    <div className="container">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <h1 className="text-h1" style={{ margin: 0 }}>Library</h1>
          <p className="body-sm" style={{ color: "var(--muted-foreground)", marginTop: 4 }}>{GAMES.length} games across every platform you play on.</p>
        </div>
        <Button variant="outline" size="sm"><Icon name="ArrowUpDown" size={14} /> Recently updated</Button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {chips.map((c) => {
          const active = filter === c;
          const label = c === "ALL" ? "All" : STATUS[c].label;
          const n = c === "ALL" ? GAMES.length : counts[c];
          return (
            <button key={c} onClick={() => setFilter(c)} className="badge"
              style={{
                cursor: "pointer", padding: "6px 12px", fontSize: ".8125rem",
                border: `1px solid ${active ? "transparent" : "var(--border)"}`,
                background: active ? "var(--primary)" : "transparent",
                color: active ? "var(--primary-foreground)" : "var(--foreground)",
                borderRadius: "var(--radius-chip)",
              }}>
              {label} <span style={{ opacity: .6, marginLeft: 2 }}>{n}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
        {items.map((g) => <LibraryItemCard key={g.id} item={g} />)}
      </div>
    </div>
  );
}

/* ============================== GAME DETAIL ============================== */
function GameDetailScreen({ gameId }) {
  const game = GAMES.find((g) => g.id === gameId) || GAMES[0];
  const [status, setStatus] = React.useState(game.status);
  const [tab, setTab] = React.useState("overview");
  const entries = JOURNAL.filter((j) => j.gameId === game.id);
  const eyebrow = [String(game.year), game.dev.toUpperCase(), "ACTION, ADVENTURE"];
  const genres = ["Action", "Adventure", "Indie"];

  return (
    <main style={{ position: "relative" }}>
      {/* screenshot backdrop */}
      <div aria-hidden="true" style={{ position: "absolute", inset: "0 0 auto 0", height: 280, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(150deg, ${game.from}, ${game.to})`, filter: "saturate(.9)" }} />
        <div style={{ position: "absolute", inset: 0, background:
          "linear-gradient(180deg, transparent 0%, color-mix(in oklch, var(--background) 40%, transparent) 55%, var(--background) 90%), linear-gradient(90deg, color-mix(in oklch, var(--background) 60%, transparent) 0%, transparent 45%)" }} />
      </div>

      <div style={{ position: "relative", padding: "0 48px 64px", maxWidth: 1180, margin: "0 auto" }}>
        <nav className="caption" style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 14, color: "var(--muted-foreground)" }}>
          <span style={{ cursor: "pointer" }} onClick={() => nav().go("library")}>Library</span>
          <span style={{ opacity: .5 }}>/</span>
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
            {/* status switcher (segmented) */}
            <div style={{ display: "inline-flex", gap: 4, padding: 4, background: "var(--muted)", borderRadius: "var(--radius-btn)", flexWrap: "wrap" }}>
              {STATUS_ORDER.map((k) => {
                const active = status === k;
                return (
                  <button key={k} onClick={() => setStatus(k)} className="body-xs"
                    style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: "calc(var(--radius-btn) - 1px)", border: 0, fontWeight: 600,
                      background: active ? "var(--card)" : "transparent",
                      color: active ? "var(--foreground)" : "var(--muted-foreground)",
                      boxShadow: active ? "var(--shadow-paper-sm)" : "none" }}>
                    <Icon name={STATUS[k].icon} size={13} /> {STATUS[k].label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* tabs */}
        <div className="tabs-list" style={{ marginTop: 32 }}>
          {[["overview", "Overview"], ["journal", `Journal`], ["related", "Related"]].map(([v, l]) => (
            <div key={v} className="tab-trigger" data-active={tab === v} onClick={() => setTab(v)}>
              {l}{v === "journal" ? <span style={{ marginLeft: 6, background: "var(--muted)", color: "var(--muted-foreground)", borderRadius: 9999, padding: "1px 7px", fontSize: ".7rem" }}>{entries.length}</span> : null}
            </div>
          ))}
        </div>

        {tab === "overview" ? (
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 24 }}>
            <p className="body-lg" style={{ maxWidth: 720, color: "var(--foreground-body)", margin: 0 }}>
              A vast, ruined kingdom rendered in hand-drawn ink. You descend through interlocking
              caverns, learning the world's grammar one locked door at a time — patient, unhurried,
              and never once told where to go.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: 16, alignItems: "baseline" }}>
              <span className="terminal-label">// GAME.DETAIL</span>
              <dl style={{ margin: 0, fontSize: ".875rem" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <dt style={{ color: "var(--muted-foreground)", width: 96 }}>Release year</dt>
                  <dd style={{ margin: 0 }}>{game.year}</dd>
                </div>
              </dl>
              <span className="terminal-label">// GENRES</span>
              <ul style={{ display: "flex", flexWrap: "wrap", gap: 6, listStyle: "none", margin: 0, padding: 0 }}>
                {genres.map((g) => <li key={g}><Badge variant="secondary">{g}</Badge></li>)}
              </ul>
              <span className="terminal-label">// PLATFORMS</span>
              <div><PlatformBadge platform={game.platform} /></div>
            </div>
          </div>
        ) : null}

        {tab === "journal" ? (
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            {entries.length ? entries.map((e) => <JournalCard key={e.id} entry={e} />) : (
              <EmptyState title="Nothing logged yet" desc="Log tonight's session — a playtime count or a quick thought is enough." />
            )}
          </div>
        ) : null}

        {tab === "related" ? (
          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
            {GAMES.filter((g) => g.id !== game.id).slice(0, 6).map((g) => <LibraryItemCard key={g.id} item={g} />)}
          </div>
        ) : null}
      </div>
    </main>
  );
}

/* ============================== JOURNAL ============================== */
function JournalCard({ entry }) {
  const game = GAMES.find((g) => g.id === entry.gameId);
  return (
    <Card className="card-elevated" style={{ padding: 20, display: "flex", gap: 16 }}>
      {game ? <div style={{ width: 44, flexShrink: 0 }}><GameCover game={game} monoSize="0.78rem" /></div> : null}
      <div style={{ minWidth: 0 }}>
        <p className="overline" style={{ color: "var(--muted-foreground)", margin: 0 }}>
          {entry.date} · JOURNAL ENTRY{entry.session ? ` · SESSION ${entry.session}` : ""} · {entry.hours}H
        </p>
        <h3 className="heading-xs" style={{ margin: "6px 0 8px", cursor: "pointer" }} onClick={() => nav().openGame(entry.gameId)}>{entry.title}</h3>
        <p className="body-md" style={{ margin: 0, color: "var(--foreground-body)", fontStyle: "italic", lineHeight: 1.6 }}>
          &ldquo;{entry.body}&rdquo;
        </p>
      </div>
    </Card>
  );
}

function JournalScreen() {
  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 className="text-h1" style={{ margin: 0 }}>Journal</h1>
          <p className="body-sm" style={{ color: "var(--muted-foreground)", marginTop: 4 }}>Reflect, don't review. Your gaming, chronologically.</p>
        </div>
        <Button><Icon name="Plus" size={16} /> New entry</Button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {JOURNAL.map((e) => <JournalCard key={e.id} entry={e} />)}
      </div>
    </div>
  );
}

function EmptyState({ title, desc }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", border: "1px dashed var(--border)", borderRadius: "var(--radius-card)" }}>
      <h3 className="heading-xs" style={{ margin: "0 0 6px" }}>{title}</h3>
      <p className="body-sm" style={{ color: "var(--muted-foreground)", margin: 0 }}>{desc}</p>
    </div>
  );
}

/* ============================== LANDING (forced dark) ============================== */
function LandingScreen({ theme, accent, setAccent }) {
  const accents = [
    { key: "indigo", swatch: "#5a52d6" }, { key: "sage", swatch: "#468b85" },
    { key: "clay", swatch: "#b3623f" }, { key: "plum", swatch: "#9c4f86" },
  ];
  return (
    <div className="dark" style={{ background: "var(--background)", color: "var(--foreground)", minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -128, left: -96, width: 480, height: 480, borderRadius: "9999px", background: "color-mix(in oklch, var(--primary) 22%, transparent)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -160, right: 0, width: 420, height: 420, borderRadius: "9999px", background: "color-mix(in oklch, var(--primary) 10%, transparent)", filter: "blur(80px)", pointerEvents: "none" }} />

      <header style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 64px" }}>
        <div className="sidebar-brand">
          <LogoMark size={32} />
          <span style={{ fontWeight: 600, fontSize: "1rem", letterSpacing: "-0.01em" }}>SavePoint</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {setAccent ? (
            <div style={{ display: "flex", gap: 6 }}>
              {accents.map((a) => (
                <button key={a.key} title={a.key} onClick={() => setAccent(a.key)}
                  style={{ width: 16, height: 16, borderRadius: 9999, background: a.swatch, cursor: "pointer", padding: 0,
                    border: accent === a.key ? "2px solid var(--foreground)" : "2px solid transparent", outlineOffset: 1 }} />
              ))}
            </div>
          ) : null}
          <span onClick={() => nav().go("dashboard")} className="body-sm" style={{ color: "var(--muted-foreground)", cursor: "pointer" }}>Sign in</span>
        </div>
      </header>

      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 80, alignItems: "center", padding: "40px 64px 64px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <span className="overline" style={{ display: "inline-flex", alignItems: "center", gap: 8, width: "fit-content", whiteSpace: "nowrap", border: "1px solid color-mix(in oklch, var(--border) 60%, transparent)", background: "color-mix(in oklch, var(--primary) 8%, transparent)", color: "var(--muted-foreground)", padding: "5px 12px", borderRadius: "var(--radius-chip)", letterSpacing: ".18em" }}>
              <span style={{ width: 6, height: 6, borderRadius: 9999, background: "var(--primary)" }} /> FOR PATIENT GAMERS
            </span>
            <h1 style={{ fontSize: "4.5rem", lineHeight: 1.05, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
              A library, <span style={{ color: "var(--primary)" }}>not a backlog.</span>
            </h1>
            <p className="body-lg" style={{ maxWidth: 540, color: "var(--muted-foreground)", margin: 0 }}>
              Curate your collection across every platform. Journal what made each game matter.
              SavePoint is for patient gamers who treat games as worlds, not chores.
            </p>
            <div>
              <Button size="lg" onClick={() => nav().go("dashboard")}>Start your library <Icon name="ArrowRight" size={16} /></Button>
            </div>
            <ul style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px", listStyle: "none", padding: 0, margin: 0, color: "var(--muted-foreground)", fontSize: ".875rem", alignItems: "center" }}>
              <li style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="Check" size={16} strokeWidth={2.5} style={{ color: "#34d399" }} /> Free to start</li>
              <li className="kbd-dot">·</li><li>Imports from Steam</li>
              <li className="kbd-dot">·</li><li>No credit card</li>
            </ul>
          </div>
          {/* features strip */}
          <div style={{ borderTop: "1px solid color-mix(in oklch, var(--border) 30%, transparent)", paddingTop: 24 }}>
            <ul style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, listStyle: "none", margin: 0, padding: 0 }}>
              {[["Library", "All platforms · Steam import"], ["Journal", "Reflect, don't review"], ["Timeline", "Your gaming, chronologically"]].map(([t, b]) => (
                <li key={t}>
                  <p className="body-sm" style={{ fontWeight: 600, margin: 0 }}>{t}</p>
                  <p className="body-xs" style={{ color: "var(--muted-foreground)", margin: "2px 0 0" }}>{b}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* preview card */}
        <LandingPreview />
      </div>
    </div>
  );
}

function LandingPreview() {
  const hk = GAMES.find((g) => g.id === "hk");
  return (
    <div style={{ position: "relative" }}>
      <div className="card" style={{ borderRadius: 24, padding: 20, boxShadow: "0 25px 50px -12px rgba(0,0,0,.5)", background: "color-mix(in oklch, var(--card) 40%, transparent)", backdropFilter: "blur(8px)" }}>
        <div style={{ position: "relative", height: 224, borderRadius: 16, overflow: "hidden", background: "linear-gradient(150deg, color-mix(in oklch, var(--primary) 80%, white), var(--primary) 45%, color-mix(in oklch, var(--primary) 55%, black))" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,.18), transparent 60%)" }} />
          <span className="overline" style={{ position: "absolute", top: 16, left: 16, display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid rgba(255,255,255,.3)", background: "rgba(0,0,0,.2)", color: "rgba(255,255,255,.9)", padding: "3px 10px", borderRadius: "var(--radius-chip)" }}>
            <span style={{ width: 6, height: 6, borderRadius: 9999, background: "#fff" }} /> CURRENTLY EXPLORING
          </span>
          <div style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}>
            <p style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.01em", color: "#fff", margin: 0 }}>Hollow Knight</p>
            <p className="overline" style={{ color: "rgba(255,255,255,.7)", margin: "4px 0 0" }}>TEAM CHERRY · 2017</p>
          </div>
        </div>
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p className="overline" style={{ color: "var(--muted-foreground)", margin: 0 }}>SESSION 12 · 47H TOTAL</p>
          <RatingStars value={8} />
        </div>
        <div className="card" style={{ marginTop: 16, padding: 16, background: "color-mix(in oklch, var(--background) 40%, transparent)" }}>
          <p className="overline" style={{ color: "var(--muted-foreground)", margin: 0 }}>APR 22 · JOURNAL ENTRY</p>
          <p className="body-sm" style={{ color: "color-mix(in oklch, var(--foreground) 90%, transparent)", marginTop: 8, fontStyle: "italic", lineHeight: 1.6 }}>
            &ldquo;Took five tries on Hornet — finally read the dash pattern. The arena lighting in this fight is unreal.&rdquo;
          </p>
        </div>
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p className="overline" style={{ color: "var(--muted-foreground)", margin: 0, fontWeight: 500 }}>UP NEXT</p>
          <div style={{ display: "flex", gap: 8 }}>
            {["linear-gradient(135deg,#f43f5e,#f97316)", "linear-gradient(135deg,#10b981,#0d9488)", "linear-gradient(135deg,#a78bfa,#818cf8)"].map((bg, i) => (
              <span key={i} style={{ width: 24, height: 24, borderRadius: 6, background: bg }} />
            ))}
          </div>
        </div>
      </div>
      <div className="card" style={{ position: "absolute", right: 16, bottom: -12, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: "var(--radius-chip)", background: "color-mix(in oklch, var(--background) 80%, transparent)", color: "var(--muted-foreground)", fontSize: ".7rem", backdropFilter: "blur(8px)" }}>
        <span>↳</span> 218 in your library
      </div>
    </div>
  );
}

Object.assign(window, {
  LibraryItemCard, GameSection, DashboardScreen, LibraryScreen,
  GameDetailScreen, JournalScreen, LandingScreen,
});
