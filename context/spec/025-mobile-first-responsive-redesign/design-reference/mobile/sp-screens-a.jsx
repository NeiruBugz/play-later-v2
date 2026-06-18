/* SavePoint mobile screens — Dashboard (2 variants) + Library (2 variants).
   Each screen fills an <IOSDevice> content area: sticky TopBar, scrolling
   body, sticky BottomNav. Reads tweaks `t` for nav style + density. */

/* shared bits ----------------------------------------------------------- */
function ScreenRoot({ children }) {
  return <div style={{ minHeight: "100%", background: "var(--background)", color: "var(--foreground)", display: "flex", flexDirection: "column", fontFamily: "var(--font-runtime-sans)" }}>{children}</div>;
}
function Body({ children, pad = 18, style }) {
  return <div style={{ flex: 1, padding: `8px ${pad}px 20px`, ...style }}>{children}</div>;
}
function Avatar({ size = 30 }) {
  return <div style={{ width: size, height: size, borderRadius: 9999, flexShrink: 0, background: "linear-gradient(145deg,#3a4a7a,#7a1f2b)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: size * 0.4 }}>A</div>;
}

/* Horizontal snap rail */
function Rail({ children, pad = 18 }) {
  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: `2px ${pad}px 6px`, margin: `0 ${-pad}px`, scrollSnapType: "x mandatory", scrollbarWidth: "none" }}>
      {children}
    </div>
  );
}
/* Cover tile for rails / grids */
function CoverTile({ g, w = 124, showStatus = false, showMeta = true }) {
  return (
    <div onClick={() => mnav().openGame(g.id)} style={{ flex: `0 0 ${w}px`, width: w, scrollSnapAlign: "start", cursor: "pointer" }}>
      <div style={{ position: "relative" }}>
        <GameCover game={g} radius="var(--radius-cover)" monoSize="1.25rem" />
        {showStatus && <div style={{ position: "absolute", top: 7, left: 7 }}><StatusBadge status={g.status} /></div>}
        {g.progress != null && (
          <div style={{ position: "absolute", left: 7, right: 7, bottom: 7, height: 4, borderRadius: 9999, background: "rgba(0,0,0,0.4)", overflow: "hidden" }}>
            <div style={{ width: `${g.progress * 100}%`, height: "100%", background: "var(--primary)" }} />
          </div>
        )}
      </div>
      {showMeta && (
        <div style={{ marginTop: 7 }}>
          <div style={{ fontWeight: 600, fontSize: "0.82rem", lineHeight: 1.25, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.title}</div>
          <div style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", marginTop: 1 }}>{g.platform}{g.hours ? ` · ${g.hours}h` : ""}</div>
        </div>
      )}
    </div>
  );
}

/* Compact status strip — 5 counts in one row */
function StatStrip() {
  const c = statusCounts();
  const items = STATUS_ORDER.map((k) => ({ k, n: c[k], label: STATUS[k].label, key: STATUS[k].key }));
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
      {items.map((it) => (
        <div key={it.k} style={{ flex: "1 0 auto", minWidth: 58, background: "var(--card)", border: "1px solid color-mix(in oklch, var(--border) 50%, transparent)", borderRadius: "var(--radius-card)", padding: "9px 11px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: 9999, background: `var(--status-${it.key})` }} />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", color: "var(--foreground)" }}>{it.n}</span>
          </div>
          <div style={{ fontSize: "0.66rem", color: "var(--muted-foreground)", marginTop: 2, whiteSpace: "nowrap" }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}

/* =========================== DASHBOARD =========================== */
function DashboardScreen({ t, variant = "feed" }) {
  const d = dens(t.density);
  const playing = GAMES.filter((g) => g.status === "PLAYING");
  const upNext = GAMES.filter((g) => g.status === "UP_NEXT");
  const recent = GAMES.filter((g) => g.status === "PLAYED").slice(0, 5);
  const hero = playing[0];
  const lastJournal = JOURNAL[0];

  return (
    <ScreenRoot>
      <TopBar showLogo title="" trailing={
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button aria-label="Search" onClick={() => mnav().openSheet("add")} style={iconBtn}><Icon name="Search" size={20} /></button>
          <button aria-label="Profile" onClick={() => mnav().setTab("profile")} style={{ ...iconBtn, width: 44 }}><Avatar size={30} /></button>
        </div>
      } />
      <Body pad={d.pad}>
        {/* Greeting */}
        <div style={{ marginBottom: 16, marginTop: 2 }}>
          <div className="terminal-label" style={{ marginBottom: 4 }}>// TUESDAY · APR 23</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.7rem", letterSpacing: "-0.02em", color: "var(--foreground)", margin: 0, lineHeight: 1.1 }}>
            {variant === "feed" ? "Good evening, Alex." : "What did you play, Alex?"}
          </h1>
          {variant === "tonight" && <p style={{ color: "var(--muted-foreground)", margin: "6px 0 0", fontSize: "0.95rem" }}>Three worlds are mid-journey. Pick one up, or just log a session.</p>}
        </div>

        {variant === "feed" ? (
          <>
            {/* Jump back in hero */}
            <SectionHead terminal="// JUMP BACK IN" />
            <Card variant="elevated" style={{ overflow: "hidden", marginBottom: d.gap + 8, display: "flex", gap: 14, padding: d.cardPad }}>
              <div style={{ flex: "0 0 84px", cursor: "pointer" }} onClick={() => mnav().openGame(hero.id)}>
                <GameCover game={hero} radius="var(--radius-cover)" monoSize="1.1rem" />
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                <StatusBadge status="PLAYING" style={{ alignSelf: "flex-start", marginBottom: 6 }} />
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--foreground)", lineHeight: 1.2 }}>{hero.title}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--muted-foreground)", margin: "3px 0 9px" }}>Session {hero.sessions} · {hero.hours}h · {hero.platform}</div>
                <div style={{ height: 5, borderRadius: 9999, background: "var(--muted)", overflow: "hidden", marginBottom: 11 }}>
                  <div style={{ width: `${hero.progress * 100}%`, height: "100%", background: "var(--primary)" }} />
                </div>
                <Button size="sm" onClick={() => mnav().openSheet("log")} style={{ alignSelf: "stretch" }}><Icon name="BookOpen" size={16} />Log session</Button>
              </div>
            </Card>

            {/* Stats strip */}
            <div style={{ marginBottom: d.gap + 10 }}><StatStrip /></div>

            {/* Playing rail */}
            <div style={{ marginBottom: d.gap + 8 }}>
              <SectionHead label="Playing" action="All" />
              <Rail pad={d.pad}>{playing.map((g) => <CoverTile key={g.id} g={g} w={d.rail} />)}</Rail>
            </div>
            {/* Up next rail */}
            <div style={{ marginBottom: d.gap + 8 }}>
              <SectionHead label="Up next" action="All" />
              <Rail pad={d.pad}>{upNext.map((g) => <CoverTile key={g.id} g={g} w={d.rail} />)}</Rail>
            </div>
            {/* Recently added */}
            <div>
              <SectionHead label="Recently played" action="All" />
              <Rail pad={d.pad}>{recent.map((g) => <CoverTile key={g.id} g={g} w={d.rail} />)}</Rail>
            </div>
          </>
        ) : (
          <>
            {/* TONIGHT variant — reflective */}
            <Card variant="elevated" style={{ padding: d.cardPad + 2, marginBottom: d.gap + 8, background: "color-mix(in oklch, var(--primary) 6%, var(--card))", border: "1px solid color-mix(in oklch, var(--primary) 22%, transparent)" }}>
              <div className="terminal-label" style={{ marginBottom: 6 }}>// LOG TONIGHT'S SESSION</div>
              <p style={{ margin: "0 0 12px", color: "var(--foreground-body)", fontSize: "0.95rem" }}>Playtime is enough — thoughts are optional. Reflections can come later.</p>
              <Button style={{ width: "100%" }}><Icon name="Plus" size={18} />Log a session</Button>
            </Card>

            <SectionHead label="Continue" action="Library" />
            <div style={{ display: "flex", flexDirection: "column", gap: d.gap, marginBottom: d.gap + 10 }}>
              {playing.map((g) => (
                <Card key={g.id} variant="interactive" style={{ display: "flex", gap: 12, padding: d.cardPad, alignItems: "center" }}>
                  <div style={{ flex: "0 0 48px" }}><GameCover game={g} radius="6px" monoSize="0.8rem" /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.title}</div>
                    <div style={{ fontSize: "0.74rem", color: "var(--muted-foreground)", marginTop: 2 }}>{Math.round(g.progress * 100)}% · {g.hours}h</div>
                  </div>
                  <button aria-label="Log" style={{ ...iconBtn, width: 40, height: 40, background: "var(--muted)", color: "var(--primary)" }}><Icon name="BookOpen" size={18} /></button>
                </Card>
              ))}
            </div>

            <SectionHead terminal="// LAST REFLECTION" />
            <Card style={{ padding: d.cardPad }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <div style={{ flex: "0 0 34px" }}><GameCover game={byId(lastJournal.gameId)} radius="5px" monoSize="0.65rem" /></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--foreground)" }}>{byId(lastJournal.gameId).title}</div>
                  <div className="terminal-label">{lastJournal.date} · SESSION {lastJournal.session}</div>
                </div>
              </div>
              <p style={{ margin: 0, color: "var(--foreground-body)", fontSize: "0.88rem", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{lastJournal.body}</p>
            </Card>
          </>
        )}
      </Body>
      <BottomNav active="home" labels={t.navLabels} center={t.navCenter} />
    </ScreenRoot>
  );
}

/* =========================== LIBRARY =========================== */
function LibraryScreen({ t, variant = "grid" }) {
  const d = dens(t.density);
  const c = statusCounts();
  const statusOpts = [
    { value: "ALL", label: "All", },
    ...STATUS_ORDER.map((k) => ({ value: k, label: STATUS[k].label })),
  ];
  const counts = { ALL: GAMES.length, ...c };
  const shown = GAMES; // show all under "All"

  return (
    <ScreenRoot>
      <TopBar showLogo title="Library" trailing={
        <div style={{ display: "flex", gap: 2 }}>
          <button aria-label="Search" onClick={() => mnav().openSheet("add")} style={iconBtn}><Icon name="Search" size={20} /></button>
          <button aria-label="More" style={iconBtn}><Icon name="EllipsisVertical" size={20} /></button>
        </div>
      } />
      {/* Sticky status segmented row — the primary lens */}
      <Segmented options={statusOpts} value="PLAYING" counts={counts} top={52} />
      {/* Filter + view controls */}
      <div style={{ display: "flex", gap: 8, padding: `2px ${d.pad}px 10px`, alignItems: "center" }}>
        <button style={{ flex: 1, display: "inline-flex", alignItems: "center", gap: 8, height: 38, padding: "0 12px", borderRadius: "var(--radius-btn)", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground-body)", fontSize: "0.85rem", cursor: "pointer" }}>
          <Icon name="SlidersHorizontal" size={16} /> Filters
          <span style={{ marginLeft: "auto", background: "var(--primary)", color: "var(--primary-foreground)", borderRadius: 9999, fontSize: "0.7rem", fontWeight: 700, padding: "1px 7px" }}>2</span>
        </button>
        <button aria-label="Grid view" style={{ ...iconBtn, width: 38, height: 38, background: variant === "grid" ? "var(--muted)" : "transparent", border: "1px solid var(--border)" }}><Icon name="LayoutGrid" size={18} style={{ color: variant === "grid" ? "var(--primary)" : "var(--muted-foreground)" }} /></button>
        <button aria-label="List view" style={{ ...iconBtn, width: 38, height: 38, background: variant === "list" ? "var(--muted)" : "transparent", border: "1px solid var(--border)" }}><Icon name="Rows3" size={18} style={{ color: variant === "list" ? "var(--primary)" : "var(--muted-foreground)" }} /></button>
      </div>

      <Body pad={d.pad} style={{ paddingTop: 0 }}>
        {variant === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${d.cols}, 1fr)`, gap: d.gap }}>
            {shown.map((g) => (
              <div key={g.id} onClick={() => mnav().openGame(g.id)} style={{ cursor: "pointer" }}>
                <div style={{ position: "relative" }}>
                  <GameCover game={g} radius="var(--radius-cover)" monoSize={d.cols === 3 ? "1rem" : "1.25rem"} />
                  <div style={{ position: "absolute", top: 6, left: 6 }}><StatusBadge status={g.status} /></div>
                </div>
                <div style={{ fontWeight: 600, fontSize: d.cols === 3 ? "0.74rem" : "0.82rem", color: "var(--foreground)", marginTop: 6, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <span style={{ fontSize: "0.68rem", color: "var(--muted-foreground)" }}>{g.platform}</span>
                  {g.rating != null && <span style={{ marginLeft: "auto" }}><RatingStars value={g.rating} size={10} /></span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: d.gap }}>
            {shown.map((g) => (
              <Card key={g.id} variant="interactive" onClick={() => mnav().openGame(g.id)} style={{ display: "flex", gap: 12, padding: 10, alignItems: "center", cursor: "pointer" }}>
                <div style={{ flex: "0 0 46px" }}><GameCover game={g} radius="6px" monoSize="0.8rem" /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.title}</div>
                  <div style={{ fontSize: "0.74rem", color: "var(--muted-foreground)", marginTop: 2 }}>{g.dev} · {g.year}</div>
                  <div style={{ marginTop: 5 }}><RatingStars value={g.rating} size={11} /></div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <StatusBadge status={g.status} />
                  <PlatformBadge platform={g.platform} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </Body>
      <BottomNav active="library" labels={t.navLabels} center={t.navCenter} />
    </ScreenRoot>
  );
}

Object.assign(window, { ScreenRoot, Body, Avatar, Rail, CoverTile, StatStrip, DashboardScreen, LibraryScreen });
