/* SavePoint mobile screens — Profile, Settings, flow sheets (Log session,
   Add game, Search), and standalone bottom-nav demos for the Navigation section. */

/* grouped settings list (SavePoint-styled, iOS pattern) */
function SettingsGroup({ header, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      {header && <div style={{ fontFamily: "var(--font-runtime-mono)", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.68rem", color: "var(--muted-foreground)", padding: "0 4px 8px" }}>{header}</div>}
      <div style={{ background: "var(--card)", border: "1px solid color-mix(in oklch, var(--border) 55%, transparent)", borderRadius: "var(--radius-card)", overflow: "hidden", boxShadow: "var(--shadow-1)" }}>{children}</div>
    </div>
  );
}
function SettingsRow({ icon, iconBg, label, value, control, last }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 15px", borderBottom: last ? "none" : "1px solid color-mix(in oklch, var(--border) 45%, transparent)", minHeight: 52 }}>
      {icon && <div style={{ width: 30, height: 30, borderRadius: 7, background: iconBg || "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff" }}><Icon name={icon} size={17} /></div>}
      <span style={{ flex: 1, fontSize: "0.95rem", color: "var(--foreground)", fontWeight: 500 }}>{label}</span>
      {value && <span style={{ fontSize: "0.88rem", color: "var(--muted-foreground)" }}>{value}</span>}
      {control || (value !== undefined ? <Icon name="ChevronRight" size={17} style={{ color: "color-mix(in oklch, var(--muted-foreground) 60%, transparent)" }} /> : null)}
    </div>
  );
}
function Toggle({ on }) {
  return <div style={{ width: 46, height: 28, borderRadius: 9999, background: on ? "var(--primary)" : "var(--border)", position: "relative", flexShrink: 0, transition: "background var(--duration-fast)" }}>
    <div style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 24, height: 24, borderRadius: 9999, background: "#fff", boxShadow: "var(--shadow-1)" }} />
  </div>;
}

/* =========================== PROFILE =========================== */
function ProfileScreen({ t }) {
  const d = dens(t.density);
  const c = statusCounts();
  const played = GAMES.filter((g) => g.status === "PLAYED");
  return (
    <ScreenRoot>
      {/* banner */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 40, display: "flex", justifyContent: "space-between", padding: "8px 10px", minHeight: 52 }}>
          <span />
          <button aria-label="Settings" onClick={() => mnav().go("settings")} style={{ width: 40, height: 40, borderRadius: 9999, border: "none", background: "color-mix(in oklch, var(--card) 70%, transparent)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "var(--foreground)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="Settings" size={19} /></button>
        </div>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 130, background: "linear-gradient(135deg, color-mix(in oklch, var(--primary) 55%, #3a4a7a), color-mix(in oklch, var(--primary) 20%, var(--background)))", zIndex: -1 }} />
      </div>
      <Body pad={d.pad} style={{ paddingTop: 0 }}>
        {/* identity */}
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
          <div style={{ width: 76, height: 76, borderRadius: 9999, border: "3px solid var(--background)", background: "linear-gradient(145deg,#3a4a7a,#7a1f2b)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1.8rem", boxShadow: "var(--shadow-2)", marginTop: -4 }}>A</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", letterSpacing: "-0.02em", color: "var(--foreground)", margin: "10px 0 0" }}>Alex Rivera</h1>
          <div style={{ color: "var(--muted-foreground)", fontSize: "0.9rem" }}>@patientgamer · For patient gamers</div>
        </div>
        {/* stat row */}
        <div style={{ display: "flex", gap: 18, margin: "16px 0 4px" }}>
          {[{ n: GAMES.length, l: "in library" }, { n: c.PLAYED, l: "played" }, { n: 124, l: "sessions" }, { n: JOURNAL.length, l: "entries" }].map((s) => (
            <div key={s.l}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.15rem", color: "var(--foreground)" }}>{s.n}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>{s.l}</div>
            </div>
          ))}
        </div>
        <Button variant="outline" style={{ width: "100%", marginTop: 14 }}><Icon name="Pencil" size={16} /> Edit profile</Button>
      </Body>
      {/* sticky tabs */}
      <Segmented sticky top={0} value="library" options={[{ value: "overview", label: "Overview" }, { value: "library", label: "Library" }, { value: "activity", label: "Activity" }]} />
      <div style={{ padding: `4px ${d.pad}px 20px` }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${d.cols}, 1fr)`, gap: d.gap }}>
          {played.map((g) => (
            <div key={g.id} onClick={() => mnav().openGame(g.id)} style={{ cursor: "pointer" }}>
              <GameCover game={g} radius="var(--radius-cover)" monoSize={d.cols === 3 ? "1rem" : "1.25rem"} />
              <div style={{ fontWeight: 600, fontSize: "0.78rem", color: "var(--foreground)", marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.title}</div>
              <div style={{ marginTop: 2 }}><RatingStars value={g.rating} size={11} /></div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav active="profile" labels={t.navLabels} center={t.navCenter} />
    </ScreenRoot>
  );
}

/* =========================== SETTINGS =========================== */
function SettingsScreen({ t }) {
  const d = dens(t.density);
  return (
    <ScreenRoot>
      <TopBar onBack title="Settings" trailing={<span style={{ width: 44 }} />} />
      <Body pad={d.pad}>
        {/* profile card row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, background: "var(--card)", border: "1px solid color-mix(in oklch, var(--border) 55%, transparent)", borderRadius: "var(--radius-card)", marginBottom: 22, boxShadow: "var(--shadow-1)" }}>
          <div style={{ width: 52, height: 52, borderRadius: 9999, background: "linear-gradient(145deg,#3a4a7a,#7a1f2b)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1.3rem", flexShrink: 0 }}>A</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--foreground)" }}>Alex Rivera</div>
            <div style={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>@patientgamer</div>
          </div>
          <Icon name="ChevronRight" size={18} style={{ color: "var(--muted-foreground)" }} />
        </div>

        <SettingsGroup header="Appearance">
          <SettingsRow icon="Sun" iconBg="var(--status-upNext)" label="Theme" value="Light" />
          <SettingsRow icon="Palette" iconBg="var(--primary)" label="Accent" control={
            <div style={{ display: "flex", gap: 6 }}>
              {["var(--primary)", "oklch(0.5 0.15 274)", "oklch(0.55 0.13 42)", "oklch(0.5 0.13 330)"].map((cc, i) => (
                <span key={i} style={{ width: 20, height: 20, borderRadius: 9999, background: cc, border: i === 0 ? "2px solid var(--foreground)" : "2px solid transparent" }} />
              ))}
            </div>
          } last />
        </SettingsGroup>

        <SettingsGroup header="Library">
          <SettingsRow icon="Download" iconBg="#107c10" label="Imported games" value="48" />
          <SettingsRow icon="ArrowDownUp" iconBg="var(--info)" label="Default sort" value="Recently added" />
          <SettingsRow icon="Gamepad2" iconBg="#0070d1" label="Connected platforms" value="Steam" last />
        </SettingsGroup>

        <SettingsGroup header="Account">
          <SettingsRow icon="Mail" iconBg="var(--muted-foreground)" label="Email" value="alex@…" />
          <SettingsRow icon="Bell" iconBg="var(--status-upNext)" label="Notifications" control={<Toggle on />} />
          <SettingsRow icon="Shield" iconBg="var(--success)" label="Privacy" value="Public" last />
        </SettingsGroup>

        <SettingsGroup>
          <SettingsRow icon="LogOut" iconBg="var(--destructive)" label="Sign out" last />
        </SettingsGroup>
        <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--muted-foreground)", marginTop: 4 }}>SavePoint · v2.4 · for patient gamers</p>
      </Body>
      <BottomNav active="profile" labels={t.navLabels} center={t.navCenter} />
    </ScreenRoot>
  );
}

/* =========================== FLOW: LOG SESSION =========================== */
function LogSessionScreen({ t }) {
  return (
    <div style={{ position: "relative", height: "100%" }}>
      <div style={{ filter: "saturate(0.9)", height: "100%", overflow: "hidden", pointerEvents: "none" }}>
        <DashboardScreen t={t} variant="feed" />
      </div>
      <Sheet title="Log a session" height="82%" footer={<Button style={{ width: "100%", height: 48 }}>Save session</Button>}>
        <Field label="Game">
          <div style={{ display: "flex", alignItems: "center", gap: 11, padding: 10, border: "1px solid var(--border)", borderRadius: "var(--radius-btn)", background: "var(--card)" }}>
            <div style={{ flex: "0 0 38px" }}><GameCover game={byId("hk")} radius="5px" monoSize="0.7rem" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--foreground)" }}>Hollow Knight</div>
              <div style={{ fontSize: "0.74rem", color: "var(--muted-foreground)" }}>Main playthrough</div>
            </div>
            <Icon name="ChevronDown" size={18} style={{ color: "var(--muted-foreground)" }} />
          </div>
        </Field>

        <Field label="Playtime">
          <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center", padding: "8px 0" }}>
            <button style={{ width: 46, height: 46, borderRadius: 9999, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="Minus" size={20} /></button>
            <div style={{ textAlign: "center", minWidth: 96 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2.2rem", color: "var(--foreground)" }}>2.5</span>
              <span style={{ fontSize: "1rem", color: "var(--muted-foreground)", marginLeft: 4 }}>hrs</span>
            </div>
            <button style={{ width: 46, height: 46, borderRadius: 9999, border: "1px solid transparent", background: "var(--primary)", color: "var(--primary-foreground)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="Plus" size={20} /></button>
          </div>
        </Field>

        <Field label="When">
          <div style={{ display: "flex", gap: 8 }}>
            {["Today", "Yesterday", "Pick date"].map((x, i) => (
              <button key={x} style={{ flex: 1, height: 40, borderRadius: "var(--radius-btn)", border: i === 0 ? "1px solid transparent" : "1px solid var(--border)", background: i === 0 ? "var(--primary)" : "var(--card)", color: i === 0 ? "var(--primary-foreground)" : "var(--foreground-body)", fontSize: "0.85rem", fontWeight: 500, cursor: "pointer" }}>{x}</button>
            ))}
          </div>
        </Field>

        <Field label="Reflection" hint="Optional — playtime alone is a complete log.">
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-btn)", background: "var(--card)", padding: 12, minHeight: 64, color: "var(--muted-foreground)", fontSize: "0.9rem" }}>What stayed with you?</div>
        </Field>
      </Sheet>
    </div>
  );
}

/* =========================== FLOW: ADD GAME =========================== */
function AddGameScreen({ t }) {
  const results = GAMES.filter((g) => ["ow", "tun", "pen", "sdv", "ins"].includes(g.id));
  return (
    <div style={{ position: "relative", height: "100%" }}>
      <div style={{ filter: "saturate(0.9)", height: "100%", overflow: "hidden", pointerEvents: "none" }}>
        <LibraryScreen t={t} variant="grid" />
      </div>
      <Sheet title="Add a game" height="86%" keyboard>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 12px", height: 46, border: "1px solid var(--border)", borderRadius: 9999, background: "var(--card)", marginBottom: 16 }}>
          <Icon name="Search" size={18} style={{ color: "var(--muted-foreground)" }} />
          <span style={{ color: "var(--foreground)", fontSize: "0.95rem" }}>outer<span style={{ borderRight: "2px solid var(--primary)", marginLeft: 1 }}></span></span>
        </div>
        <div className="terminal-label" style={{ marginBottom: 10 }}>// IGDB RESULTS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {results.map((g) => (
            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: "0 0 40px" }}><GameCover game={g} radius="5px" monoSize="0.7rem" /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.title}</div>
                <div style={{ fontSize: "0.74rem", color: "var(--muted-foreground)" }}>{g.dev} · {g.year}</div>
              </div>
              <button aria-label="Add" style={{ width: 38, height: 38, borderRadius: 9999, border: "1px solid var(--border)", background: "var(--card)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="Plus" size={19} /></button>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

/* =========================== NAV BAR DEMOS =========================== */
function NavBarDemo({ labels, center, title, caption }) {
  return (
    <div style={{ width: 300, background: "var(--background)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-2)" }}>
      <div style={{ padding: "14px 16px 10px" }}>
        <div className="terminal-label" style={{ marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: "0.82rem", color: "var(--muted-foreground)", lineHeight: 1.4 }}>{caption}</div>
      </div>
      <div style={{ height: 60, background: "color-mix(in oklch, var(--muted) 40%, var(--background))", display: "flex", alignItems: "center", justifyContent: "center", color: "color-mix(in oklch, var(--muted-foreground) 60%, transparent)", fontSize: "0.78rem" }}>screen content</div>
      <BottomNav active="home" labels={labels} center={center} />
    </div>
  );
}

Object.assign(window, { ProfileScreen, SettingsScreen, LogSessionScreen, AddGameScreen, NavBarDemo, SettingsGroup, SettingsRow, Toggle });
