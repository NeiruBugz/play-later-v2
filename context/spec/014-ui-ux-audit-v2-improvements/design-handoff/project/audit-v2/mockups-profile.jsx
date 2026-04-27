// audit-v2/mockups-profile.jsx — Profile, settings, auth mockups

const PBG = 'oklch(0.155 0.007 260)';
const PCARD = 'oklch(0.18 0.007 260)';
const PCARD_SOFT = 'oklch(0.2 0.007 260)';
const PFG = 'oklch(0.93 0.005 250)';
const PMUTED = 'oklch(0.6 0.005 250)';
const PBORDER = 'oklch(0.24 0.008 250)';
const PPRIMARY = 'oklch(0.69 0.17 172)';

const profileBase = {
  fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  background: PBG, color: PFG, width: '100%', height: '100%', overflow: 'hidden',
};

const Avatar = ({ size = 64 }) => (
  <div style={{ width: size, height: size, borderRadius: 8, background: 'linear-gradient(135deg, oklch(0.5 0.18 200), oklch(0.4 0.15 280))', flexShrink: 0 }} />
);

// ───────── Finding 6: Profile header ─────────

const ProfileHeaderCurrent = () => (
  <div style={{ ...profileBase, padding: 18 }}>
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
      <Avatar size={64} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Alex Rivera</h1>
        <div style={{ fontSize: 10, color: PMUTED, marginBottom: 8 }}>@alexr</div>
        <div style={{ fontSize: 10, color: PMUTED, marginBottom: 8 }}>
          <strong style={{ color: PFG }}>142</strong> Followers · <strong style={{ color: PFG }}>87</strong> Following
        </div>
        <div style={{ fontSize: 10, color: PMUTED, marginBottom: 6 }}>alex@example.com</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{ padding: '4px 10px', background: 'transparent', border: `1px solid ${PBORDER}`, color: PFG, borderRadius: 4, fontSize: 10 }}>Edit Profile</button>
          <button style={{ padding: '4px 10px', background: 'transparent', border: `1px solid ${PBORDER}`, color: PFG, borderRadius: 4, fontSize: 10 }}>Logout</button>
        </div>
      </div>
    </div>
    <div style={{ borderTop: `1px solid ${PBORDER}`, paddingTop: 10, display: 'flex', gap: 18, fontSize: 10, color: PMUTED }}>
      <span style={{ color: PFG, borderBottom: `2px solid ${PFG}`, paddingBottom: 6, marginBottom: -11 }}>Overview</span>
      <span>Library</span>
      <span>Activity</span>
    </div>
  </div>
);

const ProfileHeaderBanner = () => (
  <div style={profileBase}>
    <div style={{ height: 64, background: 'linear-gradient(135deg, oklch(0.3 0.1 240), oklch(0.22 0.07 280))' }} />
    <div style={{ padding: '0 18px', marginTop: -28, display: 'flex', alignItems: 'flex-end', gap: 14 }}>
      <Avatar size={56} />
      <div style={{ flex: 1, paddingBottom: 8 }}>
        <h1 style={{ fontSize: 17, fontWeight: 700 }}>Alex Rivera</h1>
        <div style={{ fontSize: 10, color: PMUTED }}>@alexr · 326 games</div>
      </div>
      <button style={{ padding: '5px 10px', background: PCARD, border: `1px solid ${PBORDER}`, color: PFG, borderRadius: 5, fontSize: 10 }}>Edit</button>
    </div>
    <div style={{ padding: '14px 18px 0', display: 'flex', gap: 14, fontSize: 10, color: PMUTED }}>
      <span><strong style={{ color: PFG }}>142</strong> Followers</span>
      <span><strong style={{ color: PFG }}>87</strong> Following</span>
      <span><strong style={{ color: PFG }}>34</strong> Reviews</span>
    </div>
    <div style={{ padding: '14px 18px 0', borderBottom: `1px solid ${PBORDER}`, marginTop: 12, display: 'flex', gap: 18, fontSize: 10 }}>
      <span style={{ color: PFG, fontWeight: 600, borderBottom: `2px solid ${PPRIMARY}`, paddingBottom: 6, marginBottom: -1 }}>Overview</span>
      <span style={{ color: PMUTED, paddingBottom: 6 }}>Library</span>
      <span style={{ color: PMUTED, paddingBottom: 6 }}>Activity</span>
    </div>
  </div>
);

const ProfileHeaderCompact = () => (
  <div style={{ ...profileBase, padding: 18 }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
      <Avatar size={48} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <h1 style={{ fontSize: 16, fontWeight: 700 }}>Alex Rivera</h1>
          <span style={{ fontSize: 10, color: PMUTED }}>@alexr</span>
        </div>
        <div style={{ fontSize: 10, color: PMUTED }}>
          <strong style={{ color: PFG }}>142</strong> followers · <strong style={{ color: PFG }}>87</strong> following · <strong style={{ color: PFG }}>326</strong> games
        </div>
      </div>
      <button style={{ padding: '5px 8px', background: 'transparent', border: `1px solid ${PBORDER}`, color: PMUTED, borderRadius: 5, fontSize: 11 }}>⋯</button>
    </div>
    <div style={{ borderTop: `1px solid ${PBORDER}`, paddingTop: 12, display: 'flex', gap: 18, fontSize: 10 }}>
      <span style={{ color: PFG, fontWeight: 600, borderBottom: `2px solid ${PPRIMARY}`, paddingBottom: 6, marginBottom: -13 }}>Overview</span>
      <span style={{ color: PMUTED }}>Library</span>
      <span style={{ color: PMUTED }}>Activity</span>
    </div>
    <div style={{ marginTop: 18, fontSize: 9, color: PMUTED, fontStyle: 'italic' }}>
      Single-line metadata. Edit/Logout collapsed into ⋯ menu (only owner sees it).
    </div>
  </div>
);

const ProfileHeaderHero = () => (
  <div style={{ ...profileBase, padding: '24px 18px', textAlign: 'center' }}>
    <Avatar size={72} />
    <h1 style={{ fontSize: 19, fontWeight: 700, marginTop: 10 }}>Alex Rivera</h1>
    <div style={{ fontSize: 10, color: PMUTED, marginBottom: 10 }}>@alexr</div>
    <div style={{ display: 'flex', justifyContent: 'center', gap: 18, fontSize: 10, color: PMUTED, marginBottom: 12 }}>
      <span><strong style={{ color: PFG, display: 'block', fontSize: 14 }}>326</strong> games</span>
      <span><strong style={{ color: PFG, display: 'block', fontSize: 14 }}>142</strong> followers</span>
      <span><strong style={{ color: PFG, display: 'block', fontSize: 14 }}>87</strong> following</span>
    </div>
    <button style={{ padding: '5px 14px', background: PCARD, border: `1px solid ${PBORDER}`, color: PFG, borderRadius: 999, fontSize: 10 }}>Edit profile</button>
  </div>
);

// ───────── Finding 7: Profile tab nav vs main app nav ─────────

const TabNavCurrent = () => (
  <div style={{ ...profileBase, padding: 18 }}>
    <div style={{ fontSize: 9, color: PMUTED, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Main nav (top bar)</div>
    <div style={{ background: PCARD, padding: '8px 12px', borderRadius: 6, border: `1px solid ${PBORDER}`, display: 'flex', gap: 16, fontSize: 11, marginBottom: 16 }}>
      <span style={{ color: PFG, fontWeight: 600, borderBottom: `2px solid ${PPRIMARY}`, paddingBottom: 4, marginBottom: -9 }}>Library</span>
      <span style={{ color: PMUTED }}>Journal</span>
      <span style={{ color: PMUTED }}>Profile</span>
    </div>
    <div style={{ fontSize: 9, color: PMUTED, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Profile sub-tabs</div>
    <div style={{ borderBottom: `1px solid ${PBORDER}`, display: 'flex', gap: 18, fontSize: 11 }}>
      <span style={{ color: PFG, fontWeight: 600, borderBottom: `2px solid ${PFG}`, paddingBottom: 8, marginBottom: -1 }}>Overview</span>
      <span style={{ color: PMUTED, paddingBottom: 8 }}>Library</span>
      <span style={{ color: PMUTED, paddingBottom: 8 }}>Activity</span>
    </div>
    <div style={{ marginTop: 14, fontSize: 9, color: PMUTED, fontStyle: 'italic' }}>
      Two underline tab styles, two indicator colors, same visual weight — user can&apos;t tell scope at a glance.
    </div>
  </div>
);

const TabNavSegmented = () => (
  <div style={{ ...profileBase, padding: 18 }}>
    <div style={{ fontSize: 9, color: PMUTED, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Main nav (underline)</div>
    <div style={{ background: PCARD, padding: '8px 12px', borderRadius: 6, border: `1px solid ${PBORDER}`, display: 'flex', gap: 16, fontSize: 11, marginBottom: 16 }}>
      <span style={{ color: PFG, fontWeight: 600, borderBottom: `2px solid ${PPRIMARY}`, paddingBottom: 4, marginBottom: -9 }}>Library</span>
      <span style={{ color: PMUTED }}>Journal</span>
      <span style={{ color: PMUTED }}>Profile</span>
    </div>
    <div style={{ fontSize: 9, color: PMUTED, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Profile sub (segmented)</div>
    <div style={{ background: PCARD, padding: 3, borderRadius: 6, border: `1px solid ${PBORDER}`, display: 'inline-flex', gap: 0, fontSize: 11 }}>
      <span style={{ background: PCARD_SOFT, color: PFG, padding: '5px 12px', borderRadius: 4, fontWeight: 600 }}>Overview</span>
      <span style={{ color: PMUTED, padding: '5px 12px' }}>Library</span>
      <span style={{ color: PMUTED, padding: '5px 12px' }}>Activity</span>
    </div>
    <div style={{ marginTop: 14, fontSize: 9, color: PMUTED, fontStyle: 'italic' }}>
      Different control type signals different scope — main nav navigates pages, segmented switches a view.
    </div>
  </div>
);

const TabNavPills = () => (
  <div style={{ ...profileBase, padding: 18 }}>
    <div style={{ fontSize: 9, color: PMUTED, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Main nav (underline)</div>
    <div style={{ background: PCARD, padding: '8px 12px', borderRadius: 6, border: `1px solid ${PBORDER}`, display: 'flex', gap: 16, fontSize: 11, marginBottom: 16 }}>
      <span style={{ color: PFG, fontWeight: 600, borderBottom: `2px solid ${PPRIMARY}`, paddingBottom: 4, marginBottom: -9 }}>Library</span>
      <span style={{ color: PMUTED }}>Journal</span>
      <span style={{ color: PMUTED }}>Profile</span>
    </div>
    <div style={{ fontSize: 9, color: PMUTED, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Profile sub (pills)</div>
    <div style={{ display: 'flex', gap: 6, fontSize: 11 }}>
      <span style={{ background: PPRIMARY, color: PBG, padding: '4px 12px', borderRadius: 999, fontWeight: 600 }}>Overview</span>
      <span style={{ color: PMUTED, padding: '4px 12px', borderRadius: 999, border: `1px solid ${PBORDER}` }}>Library</span>
      <span style={{ color: PMUTED, padding: '4px 12px', borderRadius: 999, border: `1px solid ${PBORDER}` }}>Activity</span>
    </div>
    <div style={{ marginTop: 14, fontSize: 9, color: PMUTED, fontStyle: 'italic' }}>
      Pills feel like filters — appropriate when each tab is a same-page view shift, not a route.
    </div>
  </div>
);

// ───────── Finding 8: Auth page ─────────

const AuthCurrent = () => (
  <div style={{ ...profileBase, background: 'linear-gradient(135deg, oklch(0.2 0.01 260), oklch(0.155 0.007 260))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    <div style={{ background: PCARD, border: `1px solid ${PBORDER}`, borderRadius: 8, padding: 22, width: '85%', maxWidth: 280 }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>SavePoint</h1>
        <p style={{ fontSize: 10, color: PMUTED }}>Manage your gaming experiences</p>
      </div>
      <div style={{ height: 28, background: PCARD_SOFT, borderRadius: 4, marginBottom: 8 }} />
      <div style={{ height: 28, background: PCARD_SOFT, borderRadius: 4, marginBottom: 12 }} />
      <button style={{ width: '100%', padding: 8, background: PPRIMARY, color: PBG, border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 600, marginBottom: 12 }}>Sign in</button>
      <div style={{ fontSize: 9, color: PMUTED, textAlign: 'center', marginBottom: 10 }}>Or continue with</div>
      <button style={{ width: '100%', padding: 8, background: 'transparent', color: PFG, border: `1px solid ${PBORDER}`, borderRadius: 4, fontSize: 10 }}>Google</button>
    </div>
  </div>
);

const AuthSplitImage = () => (
  <div style={{ ...profileBase, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
    <div style={{ background: 'linear-gradient(135deg, oklch(0.32 0.12 240), oklch(0.22 0.08 280))', padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: PPRIMARY }} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: PFG, marginBottom: 6, letterSpacing: '-0.01em' }}>Your backlog,<br/>journaled.</div>
        <div style={{ fontSize: 9, color: 'oklch(0.85 0.02 250)', lineHeight: 1.5 }}>Track 326 games. 4 sessions. 142 followers.<br/>One library that listens.</div>
      </div>
    </div>
    <div style={{ padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h1 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Sign in</h1>
      <p style={{ fontSize: 9, color: PMUTED, marginBottom: 12 }}>Welcome back</p>
      <div style={{ height: 26, background: PCARD, borderRadius: 4, border: `1px solid ${PBORDER}`, marginBottom: 6 }} />
      <div style={{ height: 26, background: PCARD, borderRadius: 4, border: `1px solid ${PBORDER}`, marginBottom: 10 }} />
      <button style={{ width: '100%', padding: 7, background: PPRIMARY, color: PBG, border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Continue</button>
      <button style={{ width: '100%', padding: 7, background: 'transparent', color: PFG, border: `1px solid ${PBORDER}`, borderRadius: 4, fontSize: 9 }}>Google</button>
    </div>
  </div>
);

const AuthMinimal = () => (
  <div style={{ ...profileBase, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
    <div style={{ width: '100%', maxWidth: 260 }}>
      <div style={{ width: 40, height: 40, borderRadius: 9, background: PPRIMARY, marginBottom: 18 }} />
      <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.015em', marginBottom: 4 }}>Welcome back.</h1>
      <p style={{ fontSize: 11, color: PMUTED, marginBottom: 20 }}>Sign in to your library.</p>
      <button style={{ width: '100%', padding: 9, background: PFG, color: PBG, border: 'none', borderRadius: 5, fontSize: 11, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span style={{ width: 14, height: 14, borderRadius: 2, background: PBG }} /> Continue with Google
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
        <div style={{ flex: 1, height: 1, background: PBORDER }} />
        <span style={{ fontSize: 9, color: PMUTED }}>or</span>
        <div style={{ flex: 1, height: 1, background: PBORDER }} />
      </div>
      <div style={{ fontSize: 10, color: PMUTED, textAlign: 'center' }}>Use email & password</div>
    </div>
  </div>
);

const AuthEditorial = () => (
  <div style={profileBase}>
    <div style={{ padding: '20px 18px 14px', borderBottom: `1px solid ${PBORDER}`, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 22, height: 22, borderRadius: 5, background: PPRIMARY }} />
      <span style={{ fontWeight: 700, fontSize: 13 }}>SavePoint</span>
    </div>
    <div style={{ padding: 22 }}>
      <div style={{ fontSize: 9, color: PMUTED, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Sign in</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 14 }}>
        Pick up where you left off.
      </h1>
      <button style={{ width: '100%', padding: 9, background: PFG, color: PBG, border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 600, marginBottom: 8 }}>Continue with Google</button>
      <button style={{ width: '100%', padding: 9, background: 'transparent', color: PFG, border: `1px solid ${PBORDER}`, borderRadius: 5, fontSize: 10, marginBottom: 14 }}>Email & password</button>
      <div style={{ fontSize: 9, color: PMUTED, lineHeight: 1.5 }}>
        New here? <span style={{ color: PFG, textDecoration: 'underline' }}>Make an account</span> — your library waits.
      </div>
    </div>
  </div>
);

// ───────── Finding 9: Settings page sectioning ─────────

const SettingsCurrent = () => (
  <div style={{ ...profileBase, padding: 18 }}>
    <div style={{ fontSize: 9, color: PMUTED, marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Settings</div>
    <div style={{ background: PCARD, border: `1px solid ${PBORDER}`, borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Profile Settings</div>
      <div style={{ fontSize: 10, color: PMUTED, marginBottom: 14 }}>Update your profile information.</div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 500, marginBottom: 6 }}>Profile Image</div>
        <div style={{ width: 56, height: 56, borderRadius: 8, background: PCARD_SOFT, border: `1px dashed ${PBORDER}` }} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 500, marginBottom: 6 }}>Username</div>
        <div style={{ height: 28, background: PCARD_SOFT, borderRadius: 4, border: `1px solid ${PBORDER}` }} />
        <div style={{ fontSize: 9, color: PMUTED, marginTop: 4 }}>Must be 3-25 characters.</div>
      </div>
      <button style={{ padding: '6px 14px', background: PPRIMARY, color: PBG, border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>Save Changes</button>
    </div>
    <div style={{ marginTop: 12, fontSize: 9, color: PMUTED, fontStyle: 'italic' }}>One card. Avatar + username. Where do privacy, Steam, notifications, danger zone go?</div>
  </div>
);

const SettingsSectioned = () => (
  <div style={{ ...profileBase, padding: 18 }}>
    <h1 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>Settings</h1>
    {[
      { t: 'Profile', d: 'Avatar, username, display name' },
      { t: 'Privacy', d: 'Profile visibility · Activity log' },
      { t: 'Connected accounts', d: 'Steam · Google · IGDB sync' },
      { t: 'Notifications', d: 'Email · in-app · digest' },
      { t: 'Danger zone', d: 'Export · delete account', danger: true },
    ].map((s, i) => (
      <div key={i} style={{ padding: '10px 0', borderBottom: i === 4 ? 'none' : `1px solid ${PBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: s.danger ? 'oklch(0.7 0.18 25)' : PFG }}>{s.t}</div>
          <div style={{ fontSize: 9, color: PMUTED, marginTop: 1 }}>{s.d}</div>
        </div>
        <span style={{ color: PMUTED, fontSize: 12 }}>›</span>
      </div>
    ))}
  </div>
);

const SettingsSidebar = () => (
  <div style={{ ...profileBase, display: 'grid', gridTemplateColumns: '110px 1fr' }}>
    <div style={{ borderRight: `1px solid ${PBORDER}`, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
      {[
        { t: 'Profile', a: true },
        { t: 'Privacy' },
        { t: 'Accounts' },
        { t: 'Notifications' },
        { t: 'Danger', danger: true },
      ].map((s) => (
        <div key={s.t} style={{ padding: '6px 8px', fontSize: 10, borderRadius: 4, background: s.a ? PCARD : 'transparent', color: s.a ? PFG : (s.danger ? 'oklch(0.7 0.18 25)' : PMUTED), fontWeight: s.a ? 600 : 500 }}>
          {s.t}
        </div>
      ))}
    </div>
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Profile</h2>
      <div style={{ fontSize: 9, color: PMUTED, marginBottom: 14 }}>How others see you</div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 500, marginBottom: 4, color: PMUTED }}>Avatar</div>
        <div style={{ width: 44, height: 44, borderRadius: 6, background: PCARD_SOFT, border: `1px dashed ${PBORDER}` }} />
      </div>
      <div>
        <div style={{ fontSize: 9, fontWeight: 500, marginBottom: 4, color: PMUTED }}>Username</div>
        <div style={{ height: 24, background: PCARD, borderRadius: 4, border: `1px solid ${PBORDER}` }} />
      </div>
    </div>
  </div>
);

const SettingsAccordion = () => (
  <div style={{ ...profileBase, padding: 18 }}>
    <h1 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>Settings</h1>
    <div style={{ background: PCARD, border: `1px solid ${PBORDER}`, borderRadius: 6, marginBottom: 6 }}>
      <div style={{ padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600 }}>Profile</div>
          <div style={{ fontSize: 9, color: PMUTED }}>@alexr · Avatar set</div>
        </div>
        <span style={{ color: PMUTED, fontSize: 11 }}>▾</span>
      </div>
      <div style={{ borderTop: `1px solid ${PBORDER}`, padding: 10, fontSize: 10, color: PMUTED }}>
        Avatar uploader, username field, display name field, save button.
      </div>
    </div>
    {['Privacy', 'Connected accounts', 'Notifications', 'Danger zone'].map((t, i) => (
      <div key={t} style={{ background: PCARD, border: `1px solid ${PBORDER}`, borderRadius: 6, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: i === 3 ? 'oklch(0.7 0.18 25)' : PFG }}>{t}</div>
        <span style={{ color: PMUTED, fontSize: 11 }}>›</span>
      </div>
    ))}
  </div>
);

Object.assign(window, {
  Avatar,
  ProfileHeaderCurrent, ProfileHeaderBanner, ProfileHeaderCompact, ProfileHeaderHero,
  TabNavCurrent, TabNavSegmented, TabNavPills,
  AuthCurrent, AuthSplitImage, AuthMinimal, AuthEditorial,
  SettingsCurrent, SettingsSectioned, SettingsSidebar, SettingsAccordion,
});
