/* SavePoint desktop screens — Profile, Settings (two-column), and the
   Log session + Add game modal flows. Settings scales the mobile grouped
   list into a desktop section-nav + panels layout. Depends on sp-kit + d-shell. */

/* ---- settings primitives ---- */
function SetToggle({ on, onClick }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={!!on} style={{ width: 46, height: 28, borderRadius: 9999, background: on ? "var(--primary)" : "var(--border)", position: "relative", flexShrink: 0, border: "none", cursor: "pointer", padding: 0, transition: "background var(--duration-fast)" }}>
      <span style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 24, height: 24, borderRadius: 9999, background: "#fff", boxShadow: "var(--shadow-1)", transition: "left var(--duration-fast) var(--ease-in-out)" }} />
    </button>
  );
}
function SetRow({ icon, iconBg, label, sub, value, control, last }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: last ? "none" : "1px solid color-mix(in oklch, var(--border) 45%, transparent)", minHeight: 60 }}>
      {icon && <div style={{ width: 34, height: 34, borderRadius: 8, background: iconBg || "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff" }}><Icon name={icon} size={18} /></div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.95rem", color: "var(--foreground)", fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", marginTop: 2 }}>{sub}</div>}
      </div>
      {value && <span style={{ fontSize: "0.88rem", color: "var(--muted-foreground)" }}>{value}</span>}
      {control || (value !== undefined ? <Icon name="ChevronRight" size={17} style={{ color: "color-mix(in oklch, var(--muted-foreground) 55%, transparent)" }} /> : null)}
    </div>
  );
}
function SetGroup({ id, header, children, refs }) {
  return (
    <div ref={(n) => { if (refs) refs.current[id] = n; }}>
      <div style={{ fontFamily: "var(--font-runtime-mono)", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.72rem", color: "var(--muted-foreground)", padding: "0 4px 10px" }}>{header}</div>
      <div style={{ background: "var(--card)", border: "1px solid color-mix(in oklch, var(--border) 55%, transparent)", borderRadius: "var(--radius-card)", overflow: "hidden", boxShadow: "var(--shadow-1)" }}>{children}</div>
    </div>
  );
}

/* =============================== PROFILE =============================== */
function ProfileScreen({ t, nav }) {
  const [tab, setTab] = useState("library");
  const cols = t.density === "compact" ? 7 : 5;
  const counts = statusCounts();
  const played = GAMES.filter((g) => g.status === "PLAYED");
  const playing = GAMES.filter((g) => g.status === "PLAYING");
  const shown = tab === "library" ? GAMES : tab === "overview" ? playing : played;

  return (
    <div data-page style={{ height: "100%", overflowY: "auto", position: "relative" }}>
      {/* banner */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, background: "linear-gradient(135deg, color-mix(in oklch, var(--primary) 55%, #3a4a7a), color-mix(in oklch, var(--primary) 18%, var(--background)))" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, var(--background) 96%)" }} />
      </div>

      <div style={{ position: "relative", maxWidth: 1160, margin: "0 auto", padding: "0 40px 72px" }}>
        {/* identity */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 24, paddingTop: 120 }}>
          <div style={{ width: 116, height: 116, borderRadius: 9999, border: "4px solid var(--background)", background: "linear-gradient(145deg,#3a4a7a,#7a1f2b)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "2.6rem", boxShadow: "var(--shadow-2)", flexShrink: 0 }}>A</div>
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 6 }}>
            <h1 className="text-h1" style={{ margin: 0, fontFamily: "var(--font-display)" }}>Alex Rivera</h1>
            <div style={{ color: "var(--muted-foreground)", fontSize: "0.92rem", marginTop: 4 }}>@patientgamer · For patient gamers</div>
          </div>
          <div style={{ display: "flex", gap: 10, paddingBottom: 6 }}>
            <Button variant="outline"><Icon name="Pencil" size={15} /> Edit profile</Button>
            <Button variant="outline" onClick={() => nav.go("settings")}><Icon name="Settings" size={16} /></Button>
          </div>
        </div>

        {/* stats */}
        <div style={{ display: "flex", gap: 36, margin: "24px 0 8px" }}>
          {[{ n: GAMES.length, l: "in library" }, { n: counts.PLAYED, l: "played" }, { n: 124, l: "sessions" }, { n: JOURNAL.length, l: "journal entries" }, { n: "318h", l: "tracked" }].map((s) => (
            <div key={s.l}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.6rem", color: "var(--foreground)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{s.n}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--muted-foreground)", marginTop: 5 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* tabs */}
        <div className="tabs-list" style={{ margin: "24px 0 24px" }}>
          {[["overview", "Currently playing"], ["library", "All games"], ["played", "Played"]].map(([v, l]) => (
            <div key={v} className="tab-trigger" data-active={tab === v} onClick={() => setTab(v)}>{l}</div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 18 }}>
          {shown.map((g) => <GameCard key={g.id} g={g} nav={nav} />)}
        </div>
      </div>
    </div>
  );
}

/* =============================== SETTINGS =============================== */
function SettingsScreen({ t, nav, setTweak }) {
  const refs = useRef({});
  const [active, setActive] = useState("appearance");
  const sections = [
    { id: "appearance", label: "Appearance", icon: "Palette" },
    { id: "library", label: "Library", icon: "Library" },
    { id: "account", label: "Account", icon: "User" },
    { id: "danger", label: "Sign out", icon: "LogOut" },
  ];
  const go = (id) => { setActive(id); scrollToSection(refs.current[id]); };
  const accents = [["sage", "var(--primary)"], ["indigo", "oklch(0.5 0.15 274)"], ["clay", "oklch(0.55 0.13 42)"], ["plum", "oklch(0.5 0.13 330)"]];

  return (
    <Page max={1080}>
      <PageHeader eyebrow="// SETTINGS" title="Settings" sub="Tune SavePoint to your shelf." />
      <div style={{ display: "grid", gridTemplateColumns: "212px 1fr", gap: 36, alignItems: "start" }}>
        {/* section nav */}
        <nav style={{ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 3 }}>
          {sections.map((s) => (
            <button key={s.id} onClick={() => go(s.id)} className="nav-item" aria-current={active === s.id ? "page" : undefined}
              style={{ width: "100%", border: "none", background: active === s.id ? "var(--muted)" : "transparent", justifyContent: "flex-start" }}>
              <Icon name={s.icon} size={17} style={{ color: active === s.id ? "var(--primary)" : "var(--muted-foreground)" }} />
              <span>{s.label}</span>
            </button>
          ))}
        </nav>

        {/* panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 620 }}>
          {/* profile card */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, background: "var(--card)", border: "1px solid color-mix(in oklch, var(--border) 55%, transparent)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-1)" }}>
            <div style={{ width: 54, height: 54, borderRadius: 9999, background: "linear-gradient(145deg,#3a4a7a,#7a1f2b)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1.4rem", flexShrink: 0 }}>A</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "1.05rem", color: "var(--foreground)" }}>Alex Rivera</div>
              <div style={{ fontSize: "0.86rem", color: "var(--muted-foreground)" }}>@patientgamer</div>
            </div>
            <Button variant="outline" onClick={() => nav.go("profile")}>View profile</Button>
          </div>

          <SetGroup id="appearance" header="Appearance" refs={refs}>
            <SetRow icon="Moon" iconBg="oklch(0.45 0.04 270)" label="Dark mode" sub="Dim reading room" control={<SetToggle on={t.dark} onClick={() => setTweak("dark", !t.dark)} />} />
            <SetRow icon="LayoutGrid" iconBg="var(--info)" label="Density" sub="Cards per row across the app" control={
              <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--muted)", borderRadius: "var(--radius-btn)" }}>
                {["cozy", "compact"].map((d) => (
                  <button key={d} onClick={() => setTweak("density", d)} style={{ border: "none", cursor: "pointer", padding: "5px 12px", borderRadius: "calc(var(--radius-btn) - 1px)", fontSize: "0.8rem", fontWeight: 600, textTransform: "capitalize", background: t.density === d ? "var(--card)" : "transparent", color: t.density === d ? "var(--foreground)" : "var(--muted-foreground)", boxShadow: t.density === d ? "var(--shadow-paper-sm)" : "none" }}>{d}</button>
                ))}
              </div>
            } />
            <SetRow icon="Palette" iconBg="var(--primary)" label="Accent" sub="Brand hue" last control={
              <div style={{ display: "flex", gap: 8 }}>
                {accents.map(([key, cc], i) => (
                  <button key={key} onClick={() => setTweak("accent", key)} title={key} style={{ width: 24, height: 24, borderRadius: 9999, background: cc, border: t.accent === key ? "2px solid var(--foreground)" : "2px solid transparent", cursor: "pointer", padding: 0 }} />
                ))}
              </div>
            } />
          </SetGroup>

          <SetGroup id="library" header="Library" refs={refs}>
            <SetRow icon="Download" iconBg="#107c10" label="Imported games" value="48" />
            <SetRow icon="ArrowDownUp" iconBg="var(--info)" label="Default sort" value="Recently added" />
            <SetRow icon="Gamepad2" iconBg="#0070d1" label="Connected platforms" value="Steam" last />
          </SetGroup>

          <SetGroup id="account" header="Account" refs={refs}>
            <SetRow icon="Mail" iconBg="var(--muted-foreground)" label="Email" value="alex@savepoint.gg" />
            <SetRow icon="Bell" iconBg="var(--status-upNext)" label="Notifications" sub="Weekly reflection nudge" control={<SetToggle on />} />
            <SetRow icon="Shield" iconBg="var(--success)" label="Privacy" value="Public" last />
          </SetGroup>

          <div ref={(n) => { refs.current.danger = n; }}>
            <SetGroup header="">
              <SetRow icon="LogOut" iconBg="var(--destructive)" label="Sign out" last />
            </SetGroup>
            <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--muted-foreground)", marginTop: 16 }}>SavePoint · v2.4 · for patient gamers</p>
          </div>
        </div>
      </div>
    </Page>
  );
}

/* =============================== LOG SESSION MODAL =============================== */
function LogSessionModal({ nav, onClose, gameId = "hk" }) {
  const [hours, setHours] = useState(2.5);
  const [when, setWhen] = useState("Today");
  const g = byId(gameId);
  return (
    <Modal eyebrow="// LOG.SESSION" title="Log a session" onClose={onClose}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={onClose}>Save session</Button></>}>
      <FormField label="Game">
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 11, border: "1px solid var(--border)", borderRadius: "var(--radius-btn)", background: "var(--card)" }}>
          <div style={{ flex: "0 0 40px" }}><GameCover game={g} radius="5px" monoSize="0.7rem" /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--foreground)" }}>{g.title}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>Main playthrough</div>
          </div>
          <Icon name="ChevronDown" size={18} style={{ color: "var(--muted-foreground)" }} />
        </div>
      </FormField>

      <FormField label="Playtime">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, padding: "6px 0" }}>
          <button onClick={() => setHours((h) => Math.max(0.5, +(h - 0.5).toFixed(1)))} style={{ width: 46, height: 46, borderRadius: 9999, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="Minus" size={20} /></button>
          <div style={{ textAlign: "center", minWidth: 110 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2.4rem", color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>{hours}</span>
            <span style={{ fontSize: "1rem", color: "var(--muted-foreground)", marginLeft: 6 }}>hrs</span>
          </div>
          <button onClick={() => setHours((h) => +(h + 0.5).toFixed(1))} style={{ width: 46, height: 46, borderRadius: 9999, border: "1px solid transparent", background: "var(--primary)", color: "var(--primary-foreground)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="Plus" size={20} /></button>
        </div>
      </FormField>

      <FormField label="When">
        <div style={{ display: "flex", gap: 10 }}>
          {["Today", "Yesterday", "Pick date"].map((x) => {
            const on = when === x;
            return <button key={x} onClick={() => setWhen(x)} style={{ flex: 1, height: 42, borderRadius: "var(--radius-btn)", border: on ? "1px solid transparent" : "1px solid var(--border)", background: on ? "var(--primary)" : "var(--card)", color: on ? "var(--primary-foreground)" : "var(--foreground-body)", fontSize: "0.88rem", fontWeight: 500, cursor: "pointer" }}>{x}</button>;
          })}
        </div>
      </FormField>

      <FormField label="Reflection" hint="Optional — playtime alone is a complete log.">
        <textarea placeholder="What stayed with you tonight?" rows={3} style={{ width: "100%", border: "1px solid var(--border)", borderRadius: "var(--radius-btn)", background: "var(--card)", padding: 12, color: "var(--foreground)", fontSize: "0.92rem", lineHeight: 1.6, fontFamily: "var(--font-runtime-sans)", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
      </FormField>
    </Modal>
  );
}

/* =============================== ADD GAME MODAL =============================== */
function AddGameModal({ nav, onClose }) {
  const [q, setQ] = useState("outer");
  const results = GAMES.filter((g) => ["ow", "tun", "pen", "sdv", "ins"].includes(g.id));
  return (
    <Modal eyebrow="// ADD.GAME" title="Add a game" onClose={onClose} width={560}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "0 14px", height: 48, border: "1px solid var(--border)", borderRadius: 9999, background: "var(--card)", marginBottom: 18 }}>
        <Icon name="Search" size={18} style={{ color: "var(--muted-foreground)" }} />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search IGDB…" style={{ flex: 1, border: "none", background: "transparent", outline: "none", color: "var(--foreground)", fontSize: "0.95rem", fontFamily: "var(--font-runtime-sans)" }} />
        <kbd style={{ border: "1px solid var(--border)", borderRadius: 4, padding: "1px 6px", fontSize: "0.72rem", fontFamily: "var(--font-runtime-mono)", color: "var(--muted-foreground)" }}>esc</kbd>
      </div>
      <div className="terminal-label" style={{ marginBottom: 12 }}>// IGDB RESULTS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
        {results.map((g) => (
          <div key={g.id} className="card card-interactive" style={{ display: "flex", alignItems: "center", gap: 14, padding: 10, border: "1px solid transparent" }}>
            <div style={{ flex: "0 0 42px" }}><GameCover game={g} radius="5px" monoSize="0.72rem" /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.title}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>{g.dev} · {g.year}</div>
            </div>
            <Button variant="outline" size="sm"><Icon name="Plus" size={15} /> Add</Button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

Object.assign(window, { ProfileScreen, SettingsScreen, LogSessionModal, AddGameModal, SetToggle, SetRow, SetGroup });
