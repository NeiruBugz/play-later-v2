/* SavePoint desktop screens — Game detail + Journal.
   Game detail spends the width on a two-column split: a scrolling content
   column (with a sticky jump spine — the desktop form of the mobile spine) and
   a sticky right action/detail rail carrying the status switcher, the rationed
   Log CTA and the critic ring (the desktop form of the mobile sticky action
   bar). Journal pairs the timeline with a stats rail. Depends on sp-kit + d-shell. */

/* scroll a section into view inside the routed page container (no scrollIntoView) */
function scrollToSection(el) {
  if (!el) return;
  const page = el.closest("[data-page]");
  if (!page) return;
  const top = el.getBoundingClientRect().top - page.getBoundingClientRect().top + page.scrollTop - 80;
  page.scrollTo({ top, behavior: "smooth" });
}

/* ----- detail section card ----- */
function GDSection({ id, terminal, action, children, refs }) {
  return (
    <div ref={(n) => { if (refs) refs.current[id] = n; }}>
      <Card style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <span className="terminal-label">{terminal}</span>
          {action && <button onClick={action.onClick} style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "none", background: "transparent", color: "var(--primary)", fontWeight: 500, fontSize: "0.82rem", cursor: "pointer" }}>{action.label}<Icon name={action.icon || "Plus"} size={14} /></button>}
        </div>
        {children}
      </Card>
    </div>
  );
}

/* =============================== GAME DETAIL =============================== */
function GameDetailScreen({ t, nav, gameId }) {
  const g = byId(gameId) || GAMES[0];
  const [status, setStatus] = useState(g.status);
  const [activeSpine, setActiveSpine] = useState("playthroughs");
  const refs = useRef({});
  useEffect(() => { setStatus(g.status); }, [g.id]);

  const genres = ["Metroidvania", "Action", "Indie", "Atmospheric", "Difficult"];
  const related = GAMES.filter((x) => ["cel", "ins", "tun", "obra", "jrn"].includes(x.id));
  const entry = JOURNAL.find((j) => j.gameId === g.id) || JOURNAL[0];
  const spine = [
    { id: "playthroughs", label: "Playthroughs" },
    { id: "about", label: "About" },
    { id: "journal", label: "Journal" },
    { id: "related", label: "Related" },
  ];
  const go = (id) => { setActiveSpine(id); scrollToSection(refs.current[id]); };

  return (
    <div data-page style={{ height: "100%", overflowY: "auto", position: "relative" }}>
      {/* screenshot backdrop */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 340, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(150deg, ${g.from}, ${g.to})`, filter: "saturate(0.9)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 22% 0%, rgba(255,255,255,0.14), transparent 55%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, color-mix(in oklch, var(--background) 5%, transparent) 0%, color-mix(in oklch, var(--background) 45%, transparent) 55%, var(--background) 92%), linear-gradient(90deg, color-mix(in oklch, var(--background) 45%, transparent), transparent 50%)" }} />
      </div>

      <div style={{ position: "relative", maxWidth: 1160, margin: "0 auto", padding: "0 40px 72px" }}>
        {/* breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 24, fontSize: "0.82rem", color: "var(--muted-foreground)" }}>
          <button onClick={() => nav.go("library")} style={{ border: "none", background: "transparent", color: "inherit", cursor: "pointer", fontSize: "inherit", padding: 0 }}>Library</button>
          <span style={{ opacity: 0.5 }}>/</span>
          <span style={{ color: "var(--foreground)", fontWeight: 500 }}>{g.title}</span>
        </nav>

        {/* hero */}
        <section style={{ display: "grid", gridTemplateColumns: "176px 1fr", gap: 28, alignItems: "flex-end", paddingTop: 120 }}>
          <div style={{ width: 176, boxShadow: "var(--shadow-3)", borderRadius: "var(--radius-cover)" }}><GameCover game={g} radius="var(--radius-cover)" monoSize="2.2rem" /></div>
          <div style={{ minWidth: 0, paddingBottom: 6 }}>
            <div className="terminal-label" style={{ marginBottom: 10 }}>{g.year} · {g.dev.toUpperCase()} · {genres[0].toUpperCase()}</div>
            <h1 className="text-h1" style={{ margin: 0, fontFamily: "var(--font-display)" }}>{g.title}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
              <RatingStars value={g.rating} size={16} />
              <span style={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>{g.hours}h played · {g.sessions} sessions</span>
              <PlatformBadge platform={g.platform} />
            </div>
          </div>
        </section>

        {/* two-column: content + sticky rail */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, marginTop: 32, alignItems: "start" }}>
          {/* content */}
          <div style={{ minWidth: 0 }}>
            {/* jump spine — sticky */}
            <div style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", gap: 6, padding: "10px 0", marginBottom: 6, background: "color-mix(in oklch, var(--background) 92%, transparent)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderBottom: "1px solid color-mix(in oklch, var(--border) 45%, transparent)" }}>
              {spine.map((s) => {
                const on = activeSpine === s.id;
                return (
                  <button key={s.id} onClick={() => go(s.id)} style={{
                    border: "none", background: "transparent", cursor: "pointer", padding: "6px 12px", borderRadius: "var(--radius-btn)",
                    fontSize: "0.85rem", fontWeight: on ? 600 : 500, color: on ? "var(--primary)" : "var(--muted-foreground)",
                    backgroundColor: on ? "color-mix(in oklch, var(--primary) 12%, transparent)" : "transparent",
                  }}>{s.label}</button>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Playthroughs */}
              <GDSection id="playthroughs" terminal="// PLAYTHROUGHS" action={{ label: "Add", icon: "Plus" }} refs={refs}>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {[{ k: "Main", st: "PLAYING", h: g.hours, s: g.sessions, p: g.platform, prog: g.progress }, { k: "Steel Soul (replay)", st: "UP_NEXT", h: 0, s: 0, p: "PC", prog: 0 }].map((pt, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", padding: i === 0 ? "0 0 14px" : "14px 0 0", borderBottom: i === 0 ? "1px solid color-mix(in oklch, var(--border) 50%, transparent)" : "none" }}>
                      <span style={{ width: 9, height: 9, borderRadius: 9999, background: `var(--status-${STATUS[pt.st].key})`, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{pt.k}</span>
                          <StatusBadge status={pt.st} />
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", marginTop: 3 }}>{pt.s ? `${pt.s} sessions · ${pt.h}h · ${pt.p}` : `Queued · ${pt.p}`}</div>
                      </div>
                      {pt.prog > 0 && (
                        <div style={{ width: 120, height: 5, borderRadius: 9999, background: "var(--muted)", overflow: "hidden" }}>
                          <div style={{ width: `${pt.prog * 100}%`, height: "100%", background: "var(--primary)" }} />
                        </div>
                      )}
                      <button aria-label="Log" onClick={() => nav.openModal("log")} style={{ ...iconBtn, width: 38, height: 38, background: "var(--muted)", color: "var(--primary)" }}><Icon name="BookOpen" size={17} /></button>
                    </div>
                  ))}
                </div>
              </GDSection>

              {/* About */}
              <GDSection id="about" terminal="// ABOUT" refs={refs}>
                <p style={{ margin: "0 0 18px", color: "var(--foreground-body)", fontSize: "0.95rem", lineHeight: 1.65, maxWidth: 640 }}>
                  A hand-drawn 2D action-adventure through the ruined kingdom of Hallownest. You descend through interlocking caverns, learning the world's grammar one locked door at a time — patient, unhurried, and never once told where to go.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px 24px", fontSize: "0.88rem", maxWidth: 420, marginBottom: 18 }}>
                  <span style={{ color: "var(--muted-foreground)" }}>Developer</span><span style={{ color: "var(--foreground)", fontWeight: 500 }}>{g.dev}</span>
                  <span style={{ color: "var(--muted-foreground)" }}>Released</span><span style={{ color: "var(--foreground)", fontWeight: 500 }}>{g.year}</span>
                  <span style={{ color: "var(--muted-foreground)" }}>Publisher</span><span style={{ color: "var(--foreground)", fontWeight: 500 }}>{g.dev}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {genres.map((x) => <Badge key={x} variant="outline">{x}</Badge>)}
                  <PlatformBadge platform="PC" /><PlatformBadge platform="Switch" /><PlatformBadge platform="PlayStation" />
                </div>
              </GDSection>

              {/* Journal */}
              <GDSection id="journal" terminal="// JOURNAL" action={{ label: "Add", icon: "Plus", onClick: () => nav.openModal("log") }} refs={refs}>
                <div className="terminal-label" style={{ marginBottom: 7 }}>{entry.date} · SESSION {entry.session}</div>
                <p style={{ margin: 0, color: "var(--foreground-body)", fontSize: "0.95rem", lineHeight: 1.65, fontStyle: "italic", maxWidth: 640 }}>&ldquo;{entry.body}&rdquo;</p>
              </GDSection>

              {/* Related */}
              <div ref={(n) => { refs.current.related = n; }}>
                <div style={{ padding: "0 2px 12px" }}><span className="terminal-label">// RELATED GAMES</span></div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
                  {related.map((x) => <GameCard key={x.id} g={x} nav={nav} showStatus={false} monoSize="0.95rem" />)}
                </div>
              </div>
            </div>
          </div>

          {/* sticky action / detail rail */}
          <aside style={{ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <Card variant="elevated" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              {/* status switcher */}
              <div>
                <div className="terminal-label" style={{ marginBottom: 8 }}>// STATUS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {STATUS_ORDER.map((k) => {
                    const on = status === k;
                    return (
                      <button key={k} onClick={() => setStatus(k)} style={{
                        display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 11px", borderRadius: 9999, cursor: "pointer",
                        border: on ? "1px solid transparent" : "1px solid var(--border)",
                        background: on ? `var(--status-${STATUS[k].key})` : "var(--card)",
                        color: on ? `var(--status-${STATUS[k].key}-foreground)` : "var(--foreground-body)",
                        fontSize: "0.78rem", fontWeight: on ? 600 : 500,
                      }}><Icon name={STATUS[k].icon} size={14} /> {STATUS[k].label}</button>
                    );
                  })}
                </div>
              </div>
              <Button onClick={() => nav.openModal("log")} style={{ width: "100%", height: 44 }}><Icon name="BookOpen" size={17} /> Log a session</Button>
            </Card>

            <Card style={{ padding: 18, display: "flex", alignItems: "center", gap: 16 }}>
              <CriticRing value={g.critic} size={64} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--foreground)" }}>Critic consensus</div>
                <div style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", marginTop: 2 }}>Universal acclaim · 48 reviews</div>
              </div>
            </Card>

            <Card style={{ padding: 18 }}>
              <div className="terminal-label" style={{ marginBottom: 12 }}>// YOUR TIME</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: "0.86rem" }}>
                {[["Total played", `${g.hours}h`], ["Sessions", g.sessions], ["Progress", `${Math.round(g.progress * 100)}%`], ["Last session", entry.date]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted-foreground)" }}>{l}</span>
                    <span style={{ color: "var(--foreground)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{v}</span>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* =============================== JOURNAL =============================== */
function JournalScreen({ t, nav }) {
  const totalHours = JOURNAL.reduce((a, j) => a + (j.hours || 0), 0);
  const games = [...new Set(JOURNAL.map((j) => j.gameId))];
  return (
    <Page>
      <PageHeader eyebrow="// JOURNAL" title="Journal"
        sub="Reflect, don't review. Your gaming, chronologically."
        actions={<Button onClick={() => nav.openModal("log")}><Icon name="Plus" size={16} /> New entry</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 32, alignItems: "start" }}>
        {/* timeline */}
        <div style={{ position: "relative", maxWidth: 720 }}>
          <div style={{ position: "absolute", left: 23, top: 8, bottom: 8, width: 2, background: "color-mix(in oklch, var(--border) 70%, transparent)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {JOURNAL.map((j) => {
              const g = byId(j.gameId);
              return (
                <div key={j.id} style={{ display: "flex", gap: 18 }}>
                  <div style={{ flex: "0 0 48px", display: "flex", justifyContent: "center", paddingTop: 6 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 9999, overflow: "hidden", border: "3px solid var(--background)", boxShadow: "var(--shadow-1)", cursor: "pointer" }} onClick={() => nav.openGame(g.id)}><GameCover game={g} radius="0" monoSize="0.8rem" /></div>
                  </div>
                  <Card variant="elevated" style={{ flex: 1, minWidth: 0, padding: 20 }}>
                    <div className="overline" style={{ color: "var(--muted-foreground)", margin: 0 }}>{j.date} · JOURNAL ENTRY{j.session ? ` · SESSION ${j.session}` : ""} · {j.hours}H</div>
                    <h3 className="heading-xs" style={{ margin: "8px 0 10px", cursor: "pointer", fontFamily: "var(--font-display)" }} onClick={() => nav.openGame(g.id)}>{g.title}</h3>
                    <p style={{ margin: 0, color: "var(--foreground-body)", fontSize: "0.95rem", lineHeight: 1.65, fontStyle: "italic" }}>&ldquo;{j.body}&rdquo;</p>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* stats rail */}
        <aside style={{ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 20 }}>
            <div className="terminal-label" style={{ marginBottom: 14 }}>// THIS MONTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[["Entries", JOURNAL.length], ["Hours reflected", `${totalHours}h`], ["Games journaled", games.length]].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.8rem", lineHeight: 1, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>{v}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--muted-foreground)", marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ padding: 18, background: "color-mix(in oklch, var(--primary) 6%, var(--card))", border: "1px solid color-mix(in oklch, var(--primary) 22%, transparent)" }}>
            <div className="terminal-label" style={{ marginBottom: 8 }}>// LOG TONIGHT</div>
            <p style={{ margin: "0 0 14px", color: "var(--foreground-body)", fontSize: "0.86rem", lineHeight: 1.55 }}>Playtime is enough — thoughts are optional. Reflections can come later.</p>
            <Button onClick={() => nav.openModal("log")} style={{ width: "100%" }}><Icon name="Plus" size={16} /> Log a session</Button>
          </Card>
        </aside>
      </div>
    </Page>
  );
}

Object.assign(window, { GameDetailScreen, JournalScreen, GDSection, scrollToSection });
