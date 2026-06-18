/* SavePoint mobile screens — Game Detail (2 variants) + Journal (timeline + compose sheet).
   Game detail solves GD-01 (sticky action bar) and GD-02 (navigable spine). */

/* ---- shared game-detail hero ---- */
function GDHero({ g, d, hifi }) {
  const genres = ["Metroidvania", "Action", "Indie"];
  return (
    <div style={{ position: "relative" }}>
      {/* screenshot backdrop faded into bg */}
      <div aria-hidden style={{ position: "absolute", inset: 0, height: 240, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(150deg, ${g.from}, ${g.to})`, filter: "saturate(0.9)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(140% 90% at 20% 0%, rgba(255,255,255,0.12), transparent 55%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, color-mix(in oklch, var(--background) 8%, transparent) 0%, color-mix(in oklch, var(--background) 55%, transparent) 58%, var(--background) 92%)" }} />
      </div>
      <div style={{ position: "relative", padding: `14px ${d.pad}px 4px` }}>
        {/* cover + critic */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, paddingTop: 70 }}>
          <div style={{ flex: "0 0 108px", boxShadow: "var(--shadow-3)", borderRadius: "var(--radius-cover)" }}>
            <GameCover game={g} radius="var(--radius-cover)" monoSize="1.4rem" />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "flex-end", paddingBottom: 4 }}>
            {hifi ? (
              <CriticRing value={g.critic} size={62} />
            ) : (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 9999, padding: "3px 4px 3px 10px", boxShadow: "var(--shadow-1)" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--muted-foreground)", fontWeight: 600 }}>CRITIC</span>
                <span style={{ width: 30, height: 30, borderRadius: 9999, background: "var(--success)", color: "var(--success-foreground)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.82rem" }}>{g.critic}</span>
              </div>
            )}
          </div>
        </div>
        {/* title block */}
        <div className="terminal-label" style={{ marginTop: 14 }}>{g.year} · {g.dev.toUpperCase()} · {genres[0].toUpperCase()}</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.7rem", letterSpacing: "-0.02em", color: "var(--foreground)", margin: "5px 0 0", lineHeight: 1.1 }}>{g.title}</h1>
      </div>
    </div>
  );
}

/* status switcher pills (inline in hero) */
function StatusSwitcher({ active = "PLAYING" }) {
  return (
    <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "0 0 2px", scrollbarWidth: "none" }}>
      {STATUS_ORDER.map((k) => {
        const on = k === active;
        const s = STATUS[k];
        return (
          <button key={k} style={{
            flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 13px", borderRadius: 9999, cursor: "pointer",
            border: on ? "1px solid transparent" : "1px solid var(--border)",
            background: on ? `var(--status-${s.key})` : "var(--card)",
            color: on ? `var(--status-${s.key}-foreground)` : "var(--foreground-body)",
            fontSize: "0.82rem", fontWeight: on ? 600 : 500, whiteSpace: "nowrap",
          }}>
            <Icon name={s.icon} size={15} /> {s.label}
          </button>
        );
      })}
    </div>
  );
}

/* section panels (reused) */
function GDPlaythroughs({ g }) {
  return (
    <Card style={{ padding: 16 }}>
      <SectionHead terminal="// PLAYTHROUGHS" action="Add" />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[{ k: "Main", st: "PLAYING", h: g.hours, s: g.sessions, p: g.platform }, { k: "Steel Soul (replay)", st: "UP_NEXT", h: 0, s: 0, p: "PC" }].map((pt, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", paddingBottom: i === 0 ? 12 : 0, borderBottom: i === 0 ? "1px solid color-mix(in oklch, var(--border) 50%, transparent)" : "none" }}>
            <span style={{ width: 9, height: 9, borderRadius: 9999, background: `var(--status-${STATUS[pt.st].key})`, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--foreground)" }}>{pt.k}</div>
              <div style={{ fontSize: "0.76rem", color: "var(--muted-foreground)", marginTop: 1 }}>{pt.s ? `${pt.s} sessions · ${pt.h}h · ${pt.p}` : `Queued · ${pt.p}`}</div>
            </div>
            <button aria-label="Log" style={{ ...iconBtn, width: 38, height: 38, background: "var(--muted)", color: "var(--primary)" }}><Icon name="BookOpen" size={17} /></button>
          </div>
        ))}
      </div>
    </Card>
  );
}
function GDAbout({ g }) {
  return (
    <Card style={{ padding: 16 }}>
      <SectionHead terminal="// ABOUT" />
      <p style={{ margin: "0 0 14px", color: "var(--foreground-body)", fontSize: "0.9rem", lineHeight: 1.6 }}>
        A hand-drawn 2D action-adventure through the ruined kingdom of Hallownest. Explore twisting caverns, battle tainted creatures, and uncover ancient mysteries at your own pace.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 18px", fontSize: "0.85rem" }}>
        <span style={{ color: "var(--muted-foreground)" }}>Developer</span><span style={{ color: "var(--foreground)", fontWeight: 500 }}>{g.dev}</span>
        <span style={{ color: "var(--muted-foreground)" }}>Released</span><span style={{ color: "var(--foreground)", fontWeight: 500 }}>{g.year}</span>
        <span style={{ color: "var(--muted-foreground)" }}>Publisher</span><span style={{ color: "var(--foreground)", fontWeight: 500 }}>{g.dev}</span>
      </div>
    </Card>
  );
}
function GDTags() {
  return (
    <Card style={{ padding: 16 }}>
      <SectionHead terminal="// GENRES & PLATFORMS" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {["Metroidvania", "Action", "Indie", "Atmospheric", "Difficult"].map((x) => <Badge key={x} variant="outline">{x}</Badge>)}
        <PlatformBadge platform="PC" /><PlatformBadge platform="Switch" /><PlatformBadge platform="PlayStation" />
      </div>
    </Card>
  );
}
function GDJournal({ g }) {
  const entry = JOURNAL.find((j) => j.gameId === g.id) || JOURNAL[0];
  return (
    <Card style={{ padding: 16 }}>
      <SectionHead terminal="// JOURNAL" action="Add" />
      <div className="terminal-label" style={{ marginBottom: 5 }}>{entry.date} · SESSION {entry.session}</div>
      <p style={{ margin: 0, color: "var(--foreground-body)", fontSize: "0.9rem", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{entry.body}</p>
    </Card>
  );
}
function GDRelated() {
  const rel = GAMES.filter((g) => ["cel", "ins", "tun", "obra"].includes(g.id));
  return (
    <div>
      <div style={{ padding: "0 2px" }}><SectionHead terminal="// RELATED GAMES" /></div>
      <Rail pad={0}>{rel.map((g) => <CoverTile key={g.id} g={g} w={96} showMeta />)}</Rail>
    </div>
  );
}

/* sticky bottom action bar (GD-01 fix) */
function GDActionBar() {
  return (
    <div style={{ position: "sticky", bottom: 0, zIndex: 30, display: "flex", gap: 10, alignItems: "center", padding: "12px 16px 26px", background: "color-mix(in oklch, var(--card) 92%, transparent)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderTop: "1px solid color-mix(in oklch, var(--border) 65%, transparent)" }}>
      <button style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 46, padding: "0 14px", borderRadius: "var(--radius-btn)", border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
        <span style={{ width: 8, height: 8, borderRadius: 9999, background: "var(--status-playing)" }} /> Playing <Icon name="ChevronDown" size={15} />
      </button>
      <Button onClick={() => mnav().openSheet("log")} style={{ flex: 1, height: 46 }}><Icon name="BookOpen" size={18} /> Log session</Button>
    </div>
  );
}

/* =========================== GAME DETAIL =========================== */
function GameDetailScreen({ t, variant = "stacked", gameId = "hk" }) {
  const d = dens(t.density);
  const g = byId(gameId) || byId("hk");
  const [tab] = [{ v: "overview", label: "Overview" }];
  const sections = ["Playthroughs", "Journal", "About", "Related"];

  return (
    <ScreenRoot>
      {/* transparent-ish top bar over hero */}
      <div style={{ position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", minHeight: 52 }}>
        <button aria-label="Back" onClick={() => mnav().back()} style={{ width: 40, height: 40, borderRadius: 9999, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "color-mix(in oklch, var(--card) 70%, transparent)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "var(--foreground)" }}><Icon name="ChevronLeft" size={22} /></button>
        <button aria-label="More" style={{ width: 40, height: 40, borderRadius: 9999, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "color-mix(in oklch, var(--card) 70%, transparent)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "var(--foreground)" }}><Icon name="EllipsisVertical" size={20} /></button>
      </div>
      <div style={{ marginTop: -52 }}>
        <GDHero g={g} d={d} hifi={t.hifi} />
      </div>

      {/* status switcher */}
      <div style={{ padding: `12px ${d.pad}px 4px` }}><StatusSwitcher active="PLAYING" /></div>

      {variant === "tabbed" ? (
        <>
          <Segmented sticky top={0} value="overview" options={[{ value: "overview", label: "Overview" }, { value: "play", label: "Playthroughs" }, { value: "journal", label: "Journal" }, { value: "about", label: "About" }]} />
          <Body pad={d.pad} style={{ paddingTop: 4 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: d.gap }}>
              <GDPlaythroughs g={g} />
              <GDJournal g={g} />
              <GDRelated />
            </div>
          </Body>
        </>
      ) : (
        <>
          {/* jump spine — quick anchors */}
          <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: `8px ${d.pad}px 6px`, position: "sticky", top: 0, zIndex: 20, background: "color-mix(in oklch, var(--background) 90%, transparent)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", scrollbarWidth: "none" }}>
            {sections.map((s, i) => (
              <span key={s} style={{ flex: "0 0 auto", fontSize: "0.78rem", fontWeight: i === 0 ? 600 : 500, color: i === 0 ? "var(--primary)" : "var(--muted-foreground)", padding: "4px 2px" }}>{s}</span>
            ))}
          </div>
          <Body pad={d.pad} style={{ paddingTop: 6 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: d.gap }}>
              <GDPlaythroughs g={g} />
              <GDJournal g={g} />
              <GDAbout g={g} />
              <GDTags />
              <GDRelated />
            </div>
          </Body>
        </>
      )}
      <GDActionBar />
    </ScreenRoot>
  );
}

/* =========================== JOURNAL =========================== */
function JournalScreen({ t, compose = false }) {
  const d = dens(t.density);
  return (
    <ScreenRoot>
      <TopBar showLogo title="Journal" trailing={<button aria-label="Search" onClick={() => mnav().openSheet("add")} style={iconBtn}><Icon name="Search" size={20} /></button>} />
      <Body pad={d.pad}>
        <p style={{ margin: "2px 0 16px", color: "var(--muted-foreground)", fontSize: "0.92rem" }}>Reflect, don't review. {JOURNAL.length} entries across your library.</p>
        <div style={{ position: "relative" }}>
          {/* timeline rail */}
          <div style={{ position: "absolute", left: 17, top: 6, bottom: 6, width: 2, background: "color-mix(in oklch, var(--border) 70%, transparent)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: d.gap + 2 }}>
            {JOURNAL.map((j) => {
              const g = byId(j.gameId);
              return (
                <div key={j.id} onClick={() => mnav().openGame(j.gameId)} style={{ display: "flex", gap: 14, cursor: "pointer" }}>
                  <div style={{ flex: "0 0 36px", display: "flex", justifyContent: "center", paddingTop: 4 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9999, overflow: "hidden", border: "2px solid var(--background)", boxShadow: "var(--shadow-1)" }}><GameCover game={g} radius="0" monoSize="0.62rem" /></div>
                  </div>
                  <Card style={{ flex: 1, minWidth: 0, padding: d.cardPad }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--foreground)" }}>{g.title}</span>
                      <span className="terminal-label" style={{ flexShrink: 0 }}>{j.date}</span>
                    </div>
                    <p style={{ margin: 0, color: "var(--foreground-body)", fontSize: "0.88rem", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{j.body}</p>
                    <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: "0.74rem", color: "var(--muted-foreground)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="Clock" size={13} /> {j.hours}h</span>
                      {j.session && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="Gamepad2" size={13} /> Session {j.session}</span>}
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </Body>
      <BottomNav active="journal" labels={t.navLabels} center={t.navCenter} />

      {compose && (
        <Sheet title="New reflection" height="78%" keyboard>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
            <div style={{ flex: "0 0 40px" }}><GameCover game={byId("hk")} radius="6px" monoSize="0.72rem" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--foreground)" }}>Hollow Knight</div>
              <div className="terminal-label">SESSION 12 · APR 23</div>
            </div>
          </div>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-card)", padding: 14, minHeight: 130, color: "var(--foreground-body)", fontSize: "0.95rem", lineHeight: 1.6 }}>
            <span style={{ color: "var(--muted-foreground)" }}>What stayed with you tonight?</span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", fontStyle: "italic", margin: "10px 2px 0" }}>Playtime is enough — thoughts are optional.</p>
        </Sheet>
      )}
      {compose && <KeyboardCap />}
    </ScreenRoot>
  );
}
/* spacer so sheet sits above the iOS keyboard mock if needed */
function KeyboardCap() { return null; }

Object.assign(window, { GameDetailScreen, JournalScreen, GDHero, StatusSwitcher });
