// audit-v2/mockups-detail.jsx — Game detail page mockups

const DBG = 'oklch(0.155 0.007 260)';
const DCARD = 'oklch(0.18 0.007 260)';
const DCARD_SOFT = 'oklch(0.2 0.007 260)';
const DFG = 'oklch(0.93 0.005 250)';
const DMUTED = 'oklch(0.6 0.005 250)';
const DBORDER = 'oklch(0.24 0.008 250)';
const DPRIMARY = 'oklch(0.69 0.17 172)';
const DSUCCESS = 'oklch(0.7 0.16 145)';

const detailBase = {
  fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  background: DBG,
  color: DFG,
  width: '100%',
  height: '100%',
  overflow: 'hidden',
};

// Cover placeholder
const Cover = ({ w = 96, h = 128, label }) => (
  <div style={{ width: w, height: h, background: `linear-gradient(135deg, oklch(0.3 0.1 250), oklch(0.25 0.08 200))`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'oklch(0.7 0.05 250)', fontSize: 9, fontWeight: 600, letterSpacing: '0.04em', textAlign: 'center', padding: 4 }}>
    {label || 'COVER'}
  </div>
);

// ───────── Finding 2: Game detail page hierarchy ─────────

const DetailCurrent = () => (
  <div style={detailBase}>
    <div style={{ height: 100, background: 'linear-gradient(180deg, oklch(0.3 0.05 240) 0%, oklch(0.22 0.04 250) 60%, oklch(0.155 0.007 260) 100%)', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top, oklch(0.5 0.15 200 / 0.3), transparent 60%)' }} />
    </div>
    <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '120px 1fr', gap: 20, marginTop: -50 }}>
      <div>
        <Cover w={120} h={160} label="HOLLOW KNIGHT" />
        <div style={{ marginTop: 10, padding: 10, background: DCARD, border: `1px solid ${DBORDER}`, borderRadius: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: DFG, marginBottom: 6 }}>Library Status</div>
          <div style={{ fontSize: 9, color: DMUTED, marginBottom: 6 }}>Add this game to your library</div>
          <div style={{ height: 22, background: DPRIMARY, borderRadius: 4, color: DBG, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>Add to Library</div>
        </div>
      </div>
      <div style={{ paddingTop: 60 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.01em' }}>Hollow Knight</h1>
        <div style={{ fontSize: 10, color: DMUTED, marginBottom: 8 }}>February 24, 2017</div>
        <p style={{ fontSize: 10, color: DMUTED, lineHeight: 1.5, marginBottom: 8 }}>
          Forge your own path in Hollow Knight! An epic action-adventure through a vast ruined kingdom of insects and heroes...
        </p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 8, color: DMUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>// Genres</span>
          <span style={{ padding: '2px 6px', fontSize: 9, background: DCARD, border: `1px solid ${DBORDER}`, borderRadius: 3 }}>Adventure</span>
          <span style={{ padding: '2px 6px', fontSize: 9, background: DCARD, border: `1px solid ${DBORDER}`, borderRadius: 3 }}>Platform</span>
        </div>
      </div>
    </div>
  </div>
);

const DetailImprovedHero = () => (
  <div style={detailBase}>
    <div style={{ height: 130, background: 'linear-gradient(180deg, oklch(0.3 0.05 240) 0%, oklch(0.18 0.02 250) 100%)', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 30%, oklch(0.5 0.15 200 / 0.4), transparent 70%)' }} />
      <div style={{ position: 'absolute', left: 20, bottom: 14, display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <Cover w={86} h={114} label="HK" />
        <div style={{ paddingBottom: 4 }}>
          <div style={{ fontSize: 9, color: DMUTED, marginBottom: 4 }}>2017 · Team Cherry</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.1, marginBottom: 6 }}>Hollow Knight</h1>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ padding: '2px 6px', fontSize: 8, background: DPRIMARY, color: DBG, borderRadius: 3, fontWeight: 600 }}>● PLAYING</span>
            <span style={{ fontSize: 9, color: DMUTED }}>★★★★☆</span>
            <span style={{ fontSize: 9, color: DMUTED }}>· 12h logged</span>
          </div>
        </div>
      </div>
    </div>
    <div style={{ padding: '14px 20px', borderBottom: `1px solid ${DBORDER}`, display: 'flex', gap: 16, fontSize: 10 }}>
      <span style={{ color: DFG, fontWeight: 600, borderBottom: `2px solid ${DPRIMARY}`, paddingBottom: 6, marginBottom: -7 }}>Overview</span>
      <span style={{ color: DMUTED }}>Journal (4)</span>
      <span style={{ color: DMUTED }}>Playtime</span>
      <span style={{ color: DMUTED }}>Related</span>
    </div>
    <div style={{ padding: 14, fontSize: 10, color: DMUTED, lineHeight: 1.5 }}>
      Title moment + status + rating live in the hero. Sidebar collapses into the hero on first paint.
    </div>
  </div>
);

const DetailImprovedSplit = () => (
  <div style={detailBase}>
    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '110px 1fr', gap: 16 }}>
      <div>
        <Cover w={110} h={146} label="HOLLOW KNIGHT" />
      </div>
      <div>
        <div style={{ fontSize: 9, color: DMUTED, marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Action-Adventure · 2017</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.1, marginBottom: 8 }}>Hollow Knight</h1>
        <p style={{ fontSize: 10, color: DMUTED, lineHeight: 1.5, marginBottom: 10 }}>
          Forge your own path through a vast ruined kingdom of insects and heroes...
        </p>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <button style={{ padding: '6px 12px', background: DPRIMARY, color: DBG, border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>+ Add to library</button>
          <button style={{ padding: '6px 12px', background: 'transparent', color: DFG, border: `1px solid ${DBORDER}`, borderRadius: 6, fontSize: 10 }}>Log session</button>
          <button style={{ padding: '6px 8px', background: 'transparent', color: DMUTED, border: `1px solid ${DBORDER}`, borderRadius: 6, fontSize: 10 }}>♡</button>
        </div>
      </div>
    </div>
    <div style={{ borderTop: `1px solid ${DBORDER}`, padding: '10px 16px', display: 'flex', gap: 14, fontSize: 9, color: DMUTED }}>
      <span><strong style={{ color: DFG, fontWeight: 600 }}>Adventure</strong> · genre</span>
      <span><strong style={{ color: DFG, fontWeight: 600 }}>PC, Switch, PS4</strong> · platforms</span>
      <span><strong style={{ color: DFG, fontWeight: 600 }}>26h</strong> · main story</span>
    </div>
    <div style={{ padding: 12, fontSize: 10, color: DMUTED, lineHeight: 1.5 }}>
      No banner — clean two-column lockup. Action buttons inline on the title row, no separate Library Status card.
    </div>
  </div>
);

const DetailImprovedStacked = () => (
  <div style={detailBase}>
    <div style={{ padding: '20px 16px', textAlign: 'center', background: 'linear-gradient(180deg, transparent 0%, oklch(0.18 0.02 200 / 0.3) 100%)' }}>
      <Cover w={100} h={134} label="HOLLOW KNIGHT" />
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 9, color: DMUTED, marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Team Cherry · 2017</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 8 }}>Hollow Knight</h1>
        <div style={{ display: 'inline-flex', gap: 6, padding: 4, background: DCARD, border: `1px solid ${DBORDER}`, borderRadius: 8 }}>
          <button style={{ padding: '5px 10px', background: DPRIMARY, color: DBG, border: 'none', borderRadius: 5, fontSize: 9, fontWeight: 600 }}>+ Library</button>
          <button style={{ padding: '5px 10px', background: 'transparent', color: DFG, border: 'none', borderRadius: 5, fontSize: 9 }}>Log</button>
          <button style={{ padding: '5px 10px', background: 'transparent', color: DFG, border: 'none', borderRadius: 5, fontSize: 9 }}>♡</button>
        </div>
      </div>
    </div>
    <div style={{ padding: '12px 16px', borderTop: `1px solid ${DBORDER}`, fontSize: 10, color: DMUTED, lineHeight: 1.5 }}>
      Centered, vertical hero — no sticky sidebar, mobile-first. Banner removed; gradient backdrop only.
    </div>
  </div>
);

// ───────── Finding 3: Library Status card ─────────

const StatusCardCurrent = () => (
  <div style={{ ...detailBase, padding: 16 }}>
    <div style={{ background: DCARD, border: `1px solid ${DBORDER}`, borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Library Status</div>
      <div style={{ marginBottom: 14 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'oklch(0.69 0.17 172 / 0.15)', color: DPRIMARY, borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
          ● Playing
        </span>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, color: DMUTED, marginBottom: 6 }}>Your rating</div>
        <div style={{ display: 'flex', gap: 4, fontSize: 14 }}>
          {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= 4 ? 'oklch(0.8 0.15 80)' : DBORDER }}>★</span>)}
        </div>
      </div>
      <div style={{ fontSize: 9, color: DMUTED, marginBottom: 14 }}>Updated: Mar 14, 2025</div>
      <button style={{ width: '100%', padding: 8, background: 'transparent', color: DFG, border: `1px solid ${DBORDER}`, borderRadius: 5, fontSize: 11 }}>
        Manage Library
      </button>
    </div>
    <div style={{ marginTop: 8, fontSize: 9, color: DMUTED, fontStyle: 'italic', textAlign: 'center' }}>
      Card chrome &gt; content. Status, rating, updated date all stack with verbose labels.
    </div>
  </div>
);

const StatusCardImprovedInline = () => (
  <div style={{ ...detailBase, padding: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'oklch(0.69 0.17 172 / 0.15)', color: DPRIMARY, borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
        ● Playing
      </span>
      <button style={{ marginLeft: 'auto', padding: '4px 8px', background: 'transparent', color: DMUTED, border: 'none', fontSize: 11 }}>
        Edit ▾
      </button>
    </div>
    <div style={{ display: 'flex', gap: 4, fontSize: 18, marginBottom: 10 }}>
      {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= 4 ? 'oklch(0.8 0.15 80)' : DBORDER, cursor: 'pointer' }}>★</span>)}
    </div>
    <div style={{ fontSize: 10, color: DMUTED, marginBottom: 8 }}>
      Updated 6 days ago · 4 sessions logged
    </div>
    <div style={{ marginTop: 18, fontSize: 9, color: DMUTED, fontStyle: 'italic' }}>
      No card. Status pill is the affordance. Rating sits inline. "Manage" hidden behind a quiet menu.
    </div>
  </div>
);

const StatusCardImprovedSegmented = () => (
  <div style={{ ...detailBase, padding: 16 }}>
    <div style={{ fontSize: 9, color: DMUTED, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Status</div>
    <div style={{ display: 'flex', gap: 0, marginBottom: 14, background: DCARD, border: `1px solid ${DBORDER}`, borderRadius: 6, padding: 2 }}>
      {[
        { l: 'Backlog' },
        { l: 'Playing', a: true },
        { l: 'Done' },
        { l: 'Shelved' },
      ].map((s) => (
        <button key={s.l} style={{ flex: 1, padding: '5px 4px', background: s.a ? DPRIMARY : 'transparent', color: s.a ? DBG : DMUTED, border: 'none', borderRadius: 4, fontSize: 9, fontWeight: s.a ? 600 : 500 }}>{s.l}</button>
      ))}
    </div>
    <div style={{ fontSize: 9, color: DMUTED, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Rating</div>
    <div style={{ display: 'flex', gap: 3, fontSize: 16, marginBottom: 14 }}>
      {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= 4 ? 'oklch(0.8 0.15 80)' : DBORDER }}>★</span>)}
    </div>
    <div style={{ display: 'flex', gap: 6 }}>
      <button style={{ flex: 1, padding: 6, background: DCARD, border: `1px solid ${DBORDER}`, borderRadius: 5, color: DFG, fontSize: 9 }}>+ Log session</button>
      <button style={{ padding: '6px 8px', background: DCARD, border: `1px solid ${DBORDER}`, borderRadius: 5, color: DMUTED, fontSize: 9 }}>⋯</button>
    </div>
    <div style={{ marginTop: 14, fontSize: 9, color: DMUTED, fontStyle: 'italic' }}>
      Status changes happen in place — no two-step modal. Log session inline.
    </div>
  </div>
);

const StatusCardImprovedActionGroup = () => (
  <div style={{ ...detailBase, padding: 16 }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
      <button style={{ padding: 10, background: 'oklch(0.69 0.17 172 / 0.12)', color: DPRIMARY, border: `1px solid oklch(0.69 0.17 172 / 0.3)`, borderRadius: 6, fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
        ● Playing ▾
      </button>
      <button style={{ padding: 10, background: DCARD, color: DFG, border: `1px solid ${DBORDER}`, borderRadius: 6, fontSize: 10, fontWeight: 500 }}>
        + Log session
      </button>
    </div>
    <div style={{ padding: 10, background: DCARD, border: `1px solid ${DBORDER}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: 10, color: DMUTED }}>Your rating</span>
      <div style={{ display: 'flex', gap: 2, fontSize: 14 }}>
        {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= 4 ? 'oklch(0.8 0.15 80)' : DBORDER }}>★</span>)}
      </div>
    </div>
    <div style={{ fontSize: 9, color: DMUTED, textAlign: 'center' }}>
      Updated 6 days ago · <span style={{ color: DFG, textDecoration: 'underline' }}>4 entries in journal</span>
    </div>
    <div style={{ marginTop: 18, fontSize: 9, color: DMUTED, fontStyle: 'italic' }}>
      Two primary actions in a 2-up grid; the rest is metadata, not chrome.
    </div>
  </div>
);

// ───────── Mobile detail hero (V1 applied to mobile) ─────────

const DetailImprovedHeroMobile = () => (
  <div style={detailBase}>
    <div style={{ height: 110, background: 'linear-gradient(180deg, oklch(0.32 0.06 240) 0%, oklch(0.155 0.007 260) 100%)', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 60% 20%, oklch(0.5 0.15 200 / 0.4), transparent 70%)' }} />
      <div style={{ position: 'absolute', top: 10, left: 12, fontSize: 10, color: DMUTED }}>← Library</div>
    </div>
    <div style={{ padding: '0 16px', marginTop: -56, position: 'relative' }}>
      <Cover w={88} h={117} label="HK" />
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 9, color: DMUTED, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 3 }}>2017 · Team Cherry</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.1, marginBottom: 8 }}>Hollow Knight</h1>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{ padding: '3px 8px', fontSize: 9, background: 'oklch(0.69 0.17 172 / 0.18)', color: DPRIMARY, borderRadius: 999, fontWeight: 600 }}>● Playing</span>
          <span style={{ fontSize: 11, color: 'oklch(0.8 0.15 80)' }}>★★★★☆</span>
          <span style={{ fontSize: 9, color: DMUTED }}>· 12h</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button style={{ padding: 8, background: DPRIMARY, color: DBG, border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>+ Log session</button>
          <button style={{ padding: 8, background: 'transparent', color: DFG, border: `1px solid ${DBORDER}`, borderRadius: 6, fontSize: 10 }}>Write entry</button>
        </div>
      </div>
    </div>
    <div style={{ marginTop: 14, padding: '10px 16px 0', borderTop: `1px solid ${DBORDER}`, display: 'flex', gap: 14, fontSize: 10 }}>
      <span style={{ color: DFG, fontWeight: 600, borderBottom: `2px solid ${DPRIMARY}`, paddingBottom: 8, marginBottom: -1 }}>Overview</span>
      <span style={{ color: DMUTED, paddingBottom: 8 }}>Journal (4)</span>
      <span style={{ color: DMUTED, paddingBottom: 8 }}>Playtime</span>
    </div>
  </div>
);

// ───────── Status: full-page comparisons (V1 inline vs V2 segmented) ─────────

const StatusPageInline = () => (
  <div style={detailBase}>
    <div style={{ height: 80, background: 'linear-gradient(180deg, oklch(0.3 0.06 240), oklch(0.18 0.02 250))' }} />
    <div style={{ padding: '0 18px', marginTop: -40, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
      <Cover w={70} h={94} label="HK" />
      <div style={{ paddingBottom: 4 }}>
        <h1 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>Hollow Knight</h1>
        <div style={{ fontSize: 9, color: DMUTED }}>2017 · Team Cherry</div>
      </div>
    </div>
    <div style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'oklch(0.69 0.17 172 / 0.15)', color: DPRIMARY, borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          ● Playing ▾
        </span>
        <div style={{ display: 'flex', gap: 3, fontSize: 16 }}>
          {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= 4 ? 'oklch(0.8 0.15 80)' : DBORDER }}>★</span>)}
        </div>
      </div>
      <div style={{ fontSize: 10, color: DMUTED, marginBottom: 12 }}>4 sessions · 12h · last played 6 days ago</div>
      <button style={{ padding: '7px 14px', background: DPRIMARY, color: DBG, border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>+ Log session</button>
    </div>
    <div style={{ borderTop: `1px solid ${DBORDER}`, padding: '12px 18px 0', fontSize: 9, color: DMUTED, fontStyle: 'italic' }}>
      <strong style={{ color: DFG, fontStyle: 'normal' }}>Pros:</strong> compact, scales to N statuses (dropdown). <strong style={{ color: DFG, fontStyle: 'normal' }}>Cons:</strong> status change is a click + menu hop, not one-tap.
    </div>
  </div>
);

const StatusPageSegmented = () => (
  <div style={detailBase}>
    <div style={{ height: 80, background: 'linear-gradient(180deg, oklch(0.3 0.06 240), oklch(0.18 0.02 250))' }} />
    <div style={{ padding: '0 18px', marginTop: -40, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
      <Cover w={70} h={94} label="HK" />
      <div style={{ paddingBottom: 4 }}>
        <h1 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>Hollow Knight</h1>
        <div style={{ fontSize: 9, color: DMUTED }}>2017 · Team Cherry</div>
      </div>
    </div>
    <div style={{ padding: '14px 18px' }}>
      <div style={{ fontSize: 9, color: DMUTED, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Status</div>
      <div style={{ display: 'flex', gap: 0, marginBottom: 12, background: DCARD, border: `1px solid ${DBORDER}`, borderRadius: 6, padding: 2, overflowX: 'auto' }}>
        {[
          { l: 'Backlog' },
          { l: 'Playing', a: true },
          { l: 'Done' },
          { l: 'Shelved' },
          { l: 'Wishlist' },
          { l: 'Replaying' },
        ].map((s) => (
          <button key={s.l} style={{ flex: '1 0 auto', padding: '5px 8px', background: s.a ? DPRIMARY : 'transparent', color: s.a ? DBG : DMUTED, border: 'none', borderRadius: 4, fontSize: 9, fontWeight: s.a ? 600 : 500, whiteSpace: 'nowrap' }}>{s.l}</button>
        ))}
      </div>
      <div style={{ fontSize: 9, color: DMUTED, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Rating</div>
      <div style={{ display: 'flex', gap: 3, fontSize: 18, marginBottom: 12 }}>
        {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= 4 ? 'oklch(0.8 0.15 80)' : DBORDER }}>★</span>)}
      </div>
      <button style={{ padding: '7px 14px', background: DPRIMARY, color: DBG, border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>+ Log session</button>
    </div>
    <div style={{ borderTop: `1px solid ${DBORDER}`, padding: '12px 18px 0', fontSize: 9, color: DMUTED, fontStyle: 'italic' }}>
      <strong style={{ color: DFG, fontStyle: 'normal' }}>Pros:</strong> all statuses visible, one-tap change, scrolls horizontally on mobile. <strong style={{ color: DFG, fontStyle: 'normal' }}>Cons:</strong> takes more vertical real-estate; 6+ items can crowd narrow viewports.
    </div>
  </div>
);

Object.assign(window, {
  Cover,
  DetailCurrent, DetailImprovedHero, DetailImprovedSplit, DetailImprovedStacked,
  DetailImprovedHeroMobile,
  StatusCardCurrent, StatusCardImprovedInline, StatusCardImprovedSegmented, StatusCardImprovedActionGroup,
  StatusPageInline, StatusPageSegmented,
});
