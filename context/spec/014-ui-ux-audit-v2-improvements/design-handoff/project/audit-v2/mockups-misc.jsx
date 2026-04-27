// audit-v2/mockups-misc.jsx — Mood/tag chips, typography rhythm

const MBG = 'oklch(0.155 0.007 260)';
const MCARD = 'oklch(0.18 0.007 260)';
const MFG = 'oklch(0.93 0.005 250)';
const MMUTED = 'oklch(0.6 0.005 250)';
const MBORDER = 'oklch(0.24 0.008 250)';
const MPRIMARY = 'oklch(0.69 0.17 172)';

const miscBase = {
  fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  background: MBG, color: MFG, width: '100%', height: '100%', overflow: 'hidden', padding: 16,
};

// ───────── Finding 10: Mood + tag chip consistency ─────────

const ChipsCurrent = () => (
  <div style={miscBase}>
    <div style={{ background: MCARD, border: `1px solid ${MBORDER}`, borderRadius: 6, padding: 12, marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Soul Master clicked</div>
      <p style={{ fontSize: 10, color: MMUTED, lineHeight: 1.5, marginBottom: 8 }}>Beat Soul Master. The fight clicked once I stopped panicking…</p>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ padding: '2px 8px', fontSize: 9, background: 'oklch(0.69 0.17 172 / 0.15)', color: MPRIMARY, borderRadius: 3, fontWeight: 600 }}>Proud</span>
        <span style={{ fontSize: 9, color: MMUTED }}>#boss</span>
        <span style={{ fontSize: 9, color: MMUTED }}>#soul-master</span>
      </div>
    </div>
    <div style={{ fontSize: 9, color: MMUTED, fontStyle: 'italic' }}>Mood = pill badge. Tags = plain muted text. They mean different things, but visually one feels clickable and the other doesn&apos;t.</div>
  </div>
);

const ChipsUnified = () => (
  <div style={miscBase}>
    <div style={{ background: MCARD, border: `1px solid ${MBORDER}`, borderRadius: 6, padding: 12, marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Soul Master clicked</div>
      <p style={{ fontSize: 10, color: MMUTED, lineHeight: 1.5, marginBottom: 8 }}>Beat Soul Master. The fight clicked once I stopped panicking…</p>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ padding: '2px 8px', fontSize: 9, background: 'oklch(0.69 0.17 172 / 0.15)', color: MPRIMARY, borderRadius: 999, fontWeight: 600 }}>● Proud</span>
        <span style={{ padding: '2px 8px', fontSize: 9, background: MBG, border: `1px solid ${MBORDER}`, color: MMUTED, borderRadius: 999 }}>boss</span>
        <span style={{ padding: '2px 8px', fontSize: 9, background: MBG, border: `1px solid ${MBORDER}`, color: MMUTED, borderRadius: 999 }}>soul-master</span>
      </div>
    </div>
    <div style={{ fontSize: 9, color: MMUTED, fontStyle: 'italic' }}>Both as chips. Mood gets a dot + filled pill (semantic). Tags get an outlined pill — clearly clickable filters.</div>
  </div>
);

const ChipsSeparated = () => (
  <div style={miscBase}>
    <div style={{ background: MCARD, border: `1px solid ${MBORDER}`, borderRadius: 6, padding: 12, marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: MPRIMARY }} />
        <span style={{ fontSize: 9, color: MPRIMARY, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Proud</span>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Soul Master clicked</div>
      <p style={{ fontSize: 10, color: MMUTED, lineHeight: 1.5, marginBottom: 8 }}>Beat Soul Master. The fight clicked once I stopped panicking…</p>
      <div style={{ display: 'flex', gap: 4 }}>
        <span style={{ padding: '2px 6px', fontSize: 9, background: 'transparent', border: `1px solid ${MBORDER}`, color: MFG, borderRadius: 3 }}>boss</span>
        <span style={{ padding: '2px 6px', fontSize: 9, background: 'transparent', border: `1px solid ${MBORDER}`, color: MFG, borderRadius: 3 }}>soul-master</span>
      </div>
    </div>
    <div style={{ fontSize: 9, color: MMUTED, fontStyle: 'italic' }}>Mood elevated to a header ribbon — sets the entry tone. Tags stay below as outlined chips.</div>
  </div>
);

// ───────── Finding 11: Typography rhythm ─────────

const TypeCurrent = () => (
  <div style={miscBase}>
    <div style={{ fontSize: 9, color: MMUTED, marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>// Library page</div>
    <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Library</h1>
    <p style={{ fontSize: 12, color: MMUTED, marginBottom: 14 }}>Manage your game collection.</p>
    <div style={{ fontSize: 9, color: MMUTED, marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>// Profile page</div>
    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Alex Rivera</h2>
    <p style={{ fontSize: 11, color: MMUTED, marginBottom: 14 }}>@alexr — joined March 2024</p>
    <div style={{ fontSize: 9, color: MMUTED, marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>// Settings page</div>
    <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Profile Settings</h2>
    <p style={{ fontSize: 10, color: MMUTED }}>Update your profile info.</p>
    <div style={{ marginTop: 14, fontSize: 9, color: MMUTED, fontStyle: 'italic' }}>3 page-level headings, 3 different sizes (22, 18, 16). Body sizes drift between 10 and 12 too.</div>
  </div>
);

const TypeScale = () => (
  <div style={miscBase}>
    <div style={{ fontSize: 9, color: MMUTED, marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Proposed type scale</div>
    {[
      { l: 'Display', s: 28, w: 700, sample: 'Hollow Knight' },
      { l: 'H1 — page title', s: 22, w: 700, sample: 'Library' },
      { l: 'H2 — section', s: 16, w: 600, sample: 'Recently played' },
      { l: 'H3 — card title', s: 13, w: 600, sample: 'Soul Master clicked' },
      { l: 'Body', s: 12, w: 400, sample: 'Beat Soul Master after a few tries.' },
      { l: 'Caption', s: 10, w: 500, sample: '2 days ago · 90m' },
      { l: 'Eyebrow', s: 9, w: 600, sample: 'STATUS · PLAYING', upper: true },
    ].map((t, i) => (
      <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12, padding: '4px 0', borderBottom: i === 6 ? 'none' : `1px solid ${MBORDER}`, alignItems: 'baseline' }}>
        <div style={{ fontSize: 9, color: MMUTED }}>{t.l}<br/><span style={{ opacity: 0.7 }}>{t.s}px / {t.w}</span></div>
        <div style={{ fontSize: t.s, fontWeight: t.w, letterSpacing: t.upper ? '0.06em' : '-0.005em', textTransform: t.upper ? 'uppercase' : 'none' }}>{t.sample}</div>
      </div>
    ))}
  </div>
);

const TypeApplied = () => (
  <div style={miscBase}>
    <div style={{ fontSize: 9, color: MMUTED, marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Same scale, three pages</div>
    <div style={{ marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${MBORDER}` }}>
      <div style={{ fontSize: 9, color: MMUTED, marginBottom: 4 }}>Library page →</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Library</div>
      <div style={{ fontSize: 12, color: MMUTED }}>Manage your game collection.</div>
    </div>
    <div style={{ marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${MBORDER}` }}>
      <div style={{ fontSize: 9, color: MMUTED, marginBottom: 4 }}>Profile page →</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Alex Rivera</div>
      <div style={{ fontSize: 12, color: MMUTED }}>@alexr — joined March 2024</div>
    </div>
    <div>
      <div style={{ fontSize: 9, color: MMUTED, marginBottom: 4 }}>Settings page →</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Settings</div>
      <div style={{ fontSize: 12, color: MMUTED }}>Account, privacy, notifications.</div>
    </div>
  </div>
);

const TypeAlt = () => (
  <div style={miscBase}>
    <div style={{ fontSize: 9, color: MMUTED, marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Editorial · 4-stop scale</div>
    <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05, marginBottom: 6 }}>Hollow Knight</div>
    <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 6 }}>Recently played</div>
    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Soul Master clicked</div>
    <div style={{ fontSize: 11, color: MMUTED, lineHeight: 1.55 }}>Beat Soul Master after a few tries.</div>
    <div style={{ marginTop: 14, fontSize: 9, color: MMUTED, fontStyle: 'italic' }}>4 sizes only: 32 / 18 / 13 / 11. Larger contrast = clearer hierarchy.</div>
  </div>
);

Object.assign(window, {
  ChipsCurrent, ChipsUnified, ChipsSeparated,
  TypeCurrent, TypeScale, TypeApplied, TypeAlt,
});
