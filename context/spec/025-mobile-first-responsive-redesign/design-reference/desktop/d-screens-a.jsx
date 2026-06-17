/* SavePoint desktop screens — Dashboard ("jump back in") + Library (shelf grid
   with the status lens). Multi-column layouts that spend the desktop width:
   the dashboard pairs a jump-back-in hero with a continue rail and a library
   breakdown; the library keeps a sticky status lens + filters above a 5/7-up
   cover grid. Reads tweaks `t` for density. Depends on sp-kit + d-shell. */

/* shared cover card -------------------------------------------------------- */
function GameCard({ g, nav, showStatus = true, monoSize = "1.15rem" }) {
  return (
    <div onClick={() => nav.openGame(g.id)} style={{ cursor: "pointer" }}>
      <div style={{ position: "relative" }}>
        <GameCover game={g} radius="var(--radius-cover)" monoSize={monoSize} />
        {showStatus && <div style={{ position: "absolute", top: 8, left: 8 }}><StatusBadge status={g.status} /></div>}
        {g.progress != null && (
          <div style={{ position: "absolute", left: 8, right: 8, bottom: 8, height: 4, borderRadius: 9999, background: "rgba(0,0,0,0.45)", overflow: "hidden" }}>
            <div style={{ width: `${g.progress * 100}%`, height: "100%", background: "var(--primary)" }} />
          </div>
        )}
      </div>
      <div style={{ marginTop: 9, fontWeight: 600, fontSize: "0.86rem", color: "var(--foreground)", lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
        <span style={{ fontSize: "0.74rem", color: "var(--muted-foreground)" }}>{g.platform}{g.hours ? ` · ${g.hours}h` : ""}</span>
        {g.rating != null && <span style={{ marginLeft: "auto" }}><RatingStars value={g.rating} size={11} /></span>}
      </div>
    </div>
  );
}

/* Section block with header + "View all" + responsive cover grid ----------- */
function CoverGrid({ title, items, cols, nav, action }) {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.2rem", letterSpacing: "-0.01em", margin: 0, color: "var(--foreground)" }}>{title}</h2>
        {action && <button onClick={action.onClick} style={{ display: "inline-flex", alignItems: "center", gap: 3, border: "none", background: "transparent", color: "var(--primary)", fontWeight: 500, fontSize: "0.82rem", cursor: "pointer" }}>{action.label}<Icon name="ChevronRight" size={15} /></button>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 18 }}>
        {items.map((g) => <GameCard key={g.id} g={g} nav={nav} />)}
      </div>
    </section>
  );
}

/* =============================== DASHBOARD =============================== */
function DashboardScreen({ t, nav }) {
  const cols = t.density === "compact" ? 7 : 5;
  const playing = GAMES.filter((g) => g.status === "PLAYING");
  const upNext = GAMES.filter((g) => g.status === "UP_NEXT");
  const recent = GAMES.filter((g) => g.status === "PLAYED");
  const hero = playing[0];
  const others = playing.slice(1);
  const counts = statusCounts();
  const total = GAMES.length;
  const lastJournal = JOURNAL[0];

  return (
    <Page>
      <PageHeader eyebrow="// TUESDAY · APR 23" title="Good evening, Alex."
        sub="Three worlds are mid-journey. Pick one up — or just log tonight's session."
        actions={<Button variant="outline" onClick={() => nav.openModal("add")}><Icon name="Plus" size={16} /> Add a game</Button>} />

      {/* Jump back in — hero + continue rail */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18, marginBottom: 28, alignItems: "stretch" }}>
        {/* hero */}
        <Card variant="elevated" style={{ display: "flex", gap: 22, padding: 22, overflow: "hidden" }}>
          <div style={{ flex: "0 0 132px", boxShadow: "var(--shadow-2)", borderRadius: "var(--radius-cover)", alignSelf: "flex-start" }}>
            <GameCover game={hero} radius="var(--radius-cover)" monoSize="1.5rem" />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
            <div className="terminal-label" style={{ marginBottom: 8 }}>// JUMP BACK IN</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <StatusBadge status="PLAYING" />
              <span style={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>Session {hero.sessions} · {hero.hours}h · {hero.platform}</span>
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.7rem", letterSpacing: "-0.02em", color: "var(--foreground)", margin: "2px 0 0", lineHeight: 1.1 }}>{hero.title}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 8px" }}>
              <div style={{ flex: 1, height: 6, borderRadius: 9999, background: "var(--muted)", overflow: "hidden" }}>
                <div style={{ width: `${hero.progress * 100}%`, height: "100%", background: "var(--primary)" }} />
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{Math.round(hero.progress * 100)}%</span>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <Button onClick={() => nav.openModal("log")}><Icon name="BookOpen" size={16} /> Log session</Button>
              <Button variant="outline" onClick={() => nav.openGame(hero.id)}>Open<Icon name="ArrowRight" size={15} /></Button>
            </div>
          </div>
        </Card>

        {/* continue rail */}
        <Card style={{ padding: 18, display: "flex", flexDirection: "column" }}>
          <div className="terminal-label" style={{ marginBottom: 12 }}>// CONTINUE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            {others.map((g) => (
              <div key={g.id} onClick={() => nav.openGame(g.id)} className="card card-interactive" style={{ display: "flex", gap: 12, padding: 10, alignItems: "center", cursor: "pointer" }}>
                <div style={{ flex: "0 0 40px" }}><GameCover game={g} radius="5px" monoSize="0.7rem" /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.86rem", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.title}</div>
                  <div style={{ fontSize: "0.74rem", color: "var(--muted-foreground)", marginTop: 2 }}>{Math.round(g.progress * 100)}% · {g.hours}h</div>
                </div>
                <button aria-label="Log" onClick={(e) => { e.stopPropagation(); nav.openModal("log"); }}
                  style={{ ...iconBtn, width: 36, height: 36, background: "var(--muted)", color: "var(--primary)" }}><Icon name="BookOpen" size={16} /></button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Library breakdown + last reflection */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 30 }}>
        <Card style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, cursor: "pointer" }} onClick={() => nav.go("library")}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span className="terminal-label">// LIBRARY</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 2, color: "var(--primary)", fontSize: "0.8rem", fontWeight: 500, whiteSpace: "nowrap" }}>View all<Icon name="ChevronRight" size={14} /></span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "3rem", lineHeight: 1, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>{total}</span>
            <span style={{ fontSize: "0.85rem", color: "var(--muted-foreground)", paddingBottom: 6 }}>games across every platform</span>
          </div>
          <div style={{ display: "flex", height: 10, borderRadius: 9999, overflow: "hidden" }}>
            {STATUS_ORDER.map((k) => counts[k] > 0 ? <div key={k} style={{ width: `${(counts[k] / total) * 100}%`, background: `var(--status-${STATUS[k].key})` }} /> : null)}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
            {STATUS_ORDER.map((k) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 9999, background: `var(--status-${STATUS[k].key})` }} />
                <span style={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>{STATUS[k].label} <span style={{ color: "var(--foreground)", fontWeight: 600 }}>{counts[k]}</span></span>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: 20, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
            <span className="terminal-label">// LAST REFLECTION</span>
            <button onClick={() => nav.go("journal")} style={{ display: "inline-flex", alignItems: "center", gap: 2, border: "none", background: "transparent", color: "var(--primary)", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer" }}>Journal<Icon name="ChevronRight" size={14} /></button>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <div style={{ flex: "0 0 40px" }}><GameCover game={byId(lastJournal.gameId)} radius="5px" monoSize="0.7rem" /></div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--foreground)" }}>{byId(lastJournal.gameId).title}</div>
              <div className="terminal-label" style={{ marginTop: 2 }}>{lastJournal.date} · SESSION {lastJournal.session}</div>
            </div>
          </div>
          <p style={{ margin: 0, color: "var(--foreground-body)", fontSize: "0.9rem", lineHeight: 1.6, fontStyle: "italic", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>&ldquo;{lastJournal.body}&rdquo;</p>
        </Card>
      </div>

      {/* Rails */}
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        <CoverGrid title="Up next" items={upNext} cols={cols} nav={nav} action={{ label: "All", onClick: () => nav.go("library", { status: "UP_NEXT" }) }} />
        <CoverGrid title="Recently played" items={recent} cols={cols} nav={nav} action={{ label: "All", onClick: () => nav.go("library", { status: "PLAYED" }) }} />
      </div>
    </Page>
  );
}

/* =============================== LIBRARY =============================== */
function LibraryScreen({ t, nav, initialStatus = "ALL" }) {
  const [status, setStatus] = useState(initialStatus);
  const [view, setView] = useState("grid");
  useEffect(() => { setStatus(initialStatus); }, [initialStatus]);

  const cols = t.density === "compact" ? 7 : 5;
  const counts = statusCounts();
  const all = { ALL: GAMES.length, ...counts };
  const chips = [{ v: "ALL", label: "All" }, ...STATUS_ORDER.map((k) => ({ v: k, label: STATUS[k].label }))];
  const shown = status === "ALL" ? GAMES : GAMES.filter((g) => g.status === status);

  return (
    <div data-page style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "36px 40px 72px" }}>
        <PageHeader eyebrow="// LIBRARY" title="Library"
          sub={`${GAMES.length} games — a shelf, not a backlog.`}
          actions={
            <>
              <Button variant="outline"><Icon name="ArrowUpDown" size={15} /> Recently updated</Button>
              <Button onClick={() => nav.openModal("add")}><Icon name="Plus" size={16} /> Add a game</Button>
            </>
          } />

        {/* Status lens — sticky */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 12, padding: "12px 0", marginBottom: 8, background: "color-mix(in oklch, var(--background) 92%, transparent)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
            {chips.map((c) => {
              const on = status === c.v;
              const dot = c.v !== "ALL";
              return (
                <button key={c.v} onClick={() => setStatus(c.v)} style={{
                  display: "inline-flex", alignItems: "center", gap: 7, height: 34, padding: "0 14px", borderRadius: 9999, cursor: "pointer",
                  border: on ? "1px solid transparent" : "1px solid var(--border)",
                  background: on ? "var(--primary)" : "var(--card)",
                  color: on ? "var(--primary-foreground)" : "var(--foreground-body)",
                  fontSize: "0.84rem", fontWeight: on ? 600 : 500,
                }}>
                  {dot && <span style={{ width: 7, height: 7, borderRadius: 9999, background: on ? "currentColor" : `var(--status-${STATUS[c.v].key})`, opacity: on ? 0.9 : 1 }} />}
                  {c.label}
                  <span style={{ fontSize: "0.74rem", opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>{all[c.v]}</span>
                </button>
              );
            })}
          </div>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 34, padding: "0 12px", borderRadius: "var(--radius-btn)", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground-body)", fontSize: "0.82rem", cursor: "pointer", flexShrink: 0 }}>
            <Icon name="SlidersHorizontal" size={15} /> Filters
            <span style={{ background: "var(--primary)", color: "var(--primary-foreground)", borderRadius: 9999, fontSize: "0.68rem", fontWeight: 700, padding: "1px 6px" }}>2</span>
          </button>
          <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
            <button aria-label="Grid" onClick={() => setView("grid")} style={{ ...iconBtn, width: 36, height: 34, background: view === "grid" ? "var(--muted)" : "transparent", border: "1px solid var(--border)" }}><Icon name="LayoutGrid" size={17} style={{ color: view === "grid" ? "var(--primary)" : "var(--muted-foreground)" }} /></button>
            <button aria-label="List" onClick={() => setView("list")} style={{ ...iconBtn, width: 36, height: 34, background: view === "list" ? "var(--muted)" : "transparent", border: "1px solid var(--border)" }}><Icon name="Rows3" size={17} style={{ color: view === "list" ? "var(--primary)" : "var(--muted-foreground)" }} /></button>
          </div>
        </div>

        {view === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 18 }}>
            {shown.map((g) => <GameCard key={g.id} g={g} nav={nav} />)}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {shown.map((g) => (
              <div key={g.id} onClick={() => nav.openGame(g.id)} className="card card-interactive" style={{ display: "flex", gap: 16, padding: 12, alignItems: "center", cursor: "pointer" }}>
                <div style={{ flex: "0 0 44px" }}><GameCover game={g} radius="5px" monoSize="0.75rem" /></div>
                <div style={{ flex: "0 0 300px", minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.title}</div>
                  <div style={{ fontSize: "0.76rem", color: "var(--muted-foreground)", marginTop: 2 }}>{g.dev} · {g.year}</div>
                </div>
                <div style={{ flex: 1 }}><RatingStars value={g.rating} size={13} /></div>
                <PlatformBadge platform={g.platform} />
                <div style={{ flex: "0 0 86px", display: "flex", justifyContent: "flex-end" }}><StatusBadge status={g.status} /></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { GameCard, CoverGrid, DashboardScreen, LibraryScreen });
