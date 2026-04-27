// audit-v2/mockups-nav.jsx — Header & navigation mockups
// All exported to window.

const NAV_BG = 'oklch(0.18 0.007 260)';
const NAV_BG_SOFT = 'oklch(0.155 0.007 260)';
const NAV_FG = 'oklch(0.93 0.005 250)';
const NAV_MUTED = 'oklch(0.6 0.005 250)';
const NAV_BORDER = 'oklch(0.24 0.008 250)';
const NAV_PRIMARY = 'oklch(0.69 0.17 172)';
const NAV_PRIMARY_SOFT = 'oklch(0.69 0.17 172 / 0.12)';

const navBase = {
  fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  background: NAV_BG_SOFT,
  color: NAV_FG,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};

// ───────── Finding 1: Header / nav redundancy ─────────

const NavCurrentDesktop = () => (
  <div style={navBase}>
    <div style={{ background: NAV_BG, borderBottom: `1px solid ${NAV_BORDER}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: NAV_PRIMARY }} />
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '0.04em' }}>SavePoint</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 13 }}>
        <span style={{ color: NAV_FG, fontWeight: 600, borderBottom: `2px solid ${NAV_PRIMARY}`, paddingBottom: 2 }}>Dashboard</span>
        <span style={{ color: NAV_MUTED }}>Library</span>
        <span style={{ color: NAV_MUTED }}>Journal</span>
        <span style={{ color: NAV_MUTED }}>Timeline</span>
        <span style={{ color: NAV_MUTED }}>Profile</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={{ background: NAV_PRIMARY, color: NAV_BG, border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>+ Add Game</button>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: NAV_BORDER }} />
      </div>
    </div>
    <div style={{ padding: 28, flex: 1, color: NAV_MUTED, fontSize: 13 }}>
      <div style={{ height: 18, width: 220, background: NAV_BORDER, borderRadius: 4, marginBottom: 12 }} />
      <div style={{ height: 14, width: 160, background: NAV_BORDER, borderRadius: 4, opacity: 0.6 }} />
      <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', fontSize: 11, color: NAV_MUTED, fontStyle: 'italic' }}>
        Note: 5 nav items + global "Add Game" CTA + Profile sub-tabs add up to 3 navigation surfaces
      </div>
    </div>
  </div>
);

const NavCurrentMobile = () => (
  <div style={navBase}>
    <div style={{ background: NAV_BG, borderBottom: `1px solid ${NAV_BORDER}`, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: NAV_PRIMARY }} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>SavePoint</span>
      </div>
      <button style={{ background: NAV_PRIMARY, color: NAV_BG, border: 'none', width: 36, height: 36, borderRadius: 6, fontWeight: 700 }}>+</button>
    </div>
    <div style={{ flex: 1, padding: 16, fontSize: 12, color: NAV_MUTED }}>
      <div style={{ height: 16, width: '60%', background: NAV_BORDER, borderRadius: 4, marginBottom: 8 }} />
      <div style={{ height: 12, width: '40%', background: NAV_BORDER, borderRadius: 4, opacity: 0.6 }} />
    </div>
    <div style={{ borderTop: `1px solid ${NAV_BORDER}`, background: NAV_BG, display: 'flex', justifyContent: 'space-around', padding: '8px 4px' }}>
      {['Search', 'Dashboard', 'Library', 'Journal', 'Timeline', 'Profile'].map((label, i) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 2px', minWidth: 0 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: i === 1 ? NAV_PRIMARY_SOFT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: i === 1 ? NAV_PRIMARY : NAV_MUTED }} />
          </div>
          <span style={{ fontSize: 9, color: i === 1 ? NAV_PRIMARY : NAV_MUTED, fontWeight: i === 1 ? 600 : 500 }}>{label}</span>
        </div>
      ))}
    </div>
  </div>
);

const NavImprovedDesktopGrouped = () => (
  <div style={navBase}>
    <div style={{ background: NAV_BG, borderBottom: `1px solid ${NAV_BORDER}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: NAV_PRIMARY }} />
          <span style={{ fontWeight: 700, fontSize: 16 }}>SavePoint</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <span style={{ color: NAV_FG, fontWeight: 600, padding: '6px 12px', borderRadius: 6, background: NAV_PRIMARY_SOFT }}>Library</span>
          <span style={{ color: NAV_MUTED, padding: '6px 12px' }}>Journal</span>
          <span style={{ color: NAV_MUTED, padding: '6px 12px' }}>Timeline</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: NAV_BG_SOFT, borderRadius: 6, border: `1px solid ${NAV_BORDER}`, fontSize: 12, color: NAV_MUTED, minWidth: 200 }}>
          <span>🔍</span> Search games... <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 5px', border: `1px solid ${NAV_BORDER}`, borderRadius: 3 }}>⌘K</span>
        </div>
        <button style={{ background: NAV_PRIMARY, color: NAV_BG, border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>+ Add</button>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: NAV_BORDER }} />
      </div>
    </div>
    <div style={{ padding: 16, flex: 1, fontSize: 11, color: NAV_MUTED, fontStyle: 'italic', textAlign: 'center' }}>
      Library / Journal / Timeline are content surfaces. Search is global. Profile lives under the avatar menu.
    </div>
  </div>
);

const NavImprovedDesktopBreadcrumb = () => (
  <div style={navBase}>
    <div style={{ background: NAV_BG, borderBottom: `1px solid ${NAV_BORDER}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: NAV_PRIMARY }} />
        <span style={{ fontWeight: 700, fontSize: 16 }}>SavePoint</span>
        <span style={{ color: NAV_MUTED, margin: '0 6px' }}>/</span>
        <span style={{ color: NAV_FG, fontWeight: 500, fontSize: 13 }}>Library</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: NAV_MUTED }}>⌘K</span>
        <button style={{ background: NAV_PRIMARY, color: NAV_BG, border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>+ Add</button>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: NAV_BORDER }} />
      </div>
    </div>
    <div style={{ background: NAV_BG_SOFT, borderBottom: `1px solid ${NAV_BORDER}`, padding: '0 24px', display: 'flex', gap: 4, fontSize: 13 }}>
      {['Library', 'Journal', 'Timeline', 'Dashboard'].map((l, i) => (
        <span key={l} style={{ padding: '10px 12px', color: i === 0 ? NAV_FG : NAV_MUTED, fontWeight: i === 0 ? 600 : 500, borderBottom: i === 0 ? `2px solid ${NAV_PRIMARY}` : '2px solid transparent', marginBottom: -1 }}>
          {l}
        </span>
      ))}
    </div>
    <div style={{ padding: 16, flex: 1, fontSize: 11, color: NAV_MUTED, fontStyle: 'italic', textAlign: 'center' }}>
      Logo as home, breadcrumb shows current section, tabs handle peer pages. Profile inside avatar menu.
    </div>
  </div>
);

const NavImprovedDesktopRail = () => (
  <div style={{ ...navBase, flexDirection: 'row' }}>
    <div style={{ width: 56, background: NAV_BG, borderRight: `1px solid ${NAV_BORDER}`, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 32, height: 32, borderRadius: 6, background: NAV_PRIMARY, marginBottom: 12 }} />
      {[
        { l: 'Library', a: true },
        { l: 'Journal' },
        { l: 'Timeline' },
        { l: 'Dashboard' },
      ].map((it) => (
        <div key={it.l} title={it.l} style={{ width: 40, height: 40, borderRadius: 8, background: it.a ? NAV_PRIMARY_SOFT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: it.a ? NAV_PRIMARY : NAV_MUTED }} />
        </div>
      ))}
      <div style={{ marginTop: 'auto', width: 32, height: 32, borderRadius: '50%', background: NAV_BORDER }} />
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 24px', borderBottom: `1px solid ${NAV_BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Library</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ padding: '6px 10px', background: NAV_BG_SOFT, border: `1px solid ${NAV_BORDER}`, borderRadius: 6, fontSize: 12, color: NAV_MUTED }}>🔍 Search ⌘K</div>
          <button style={{ background: NAV_PRIMARY, color: NAV_BG, border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>+ Add</button>
        </div>
      </div>
      <div style={{ padding: 16, flex: 1, fontSize: 11, color: NAV_MUTED, fontStyle: 'italic', textAlign: 'center' }}>
        Persistent rail — section title in page header, more vertical room for content.
      </div>
    </div>
  </div>
);

// ───────── Mobile bottom nav variants (Finding: 6 items too many) ─────────

const MobileNavCurrent6 = () => (
  <div style={navBase}>
    <div style={{ flex: 1, padding: 16, fontSize: 12, color: NAV_MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontStyle: 'italic' }}>Six tabs · &lt;60px each · Search label often truncates</span>
    </div>
    <div style={{ borderTop: `1px solid ${NAV_BORDER}`, background: NAV_BG, display: 'flex', justifyContent: 'space-around', padding: '8px 4px' }}>
      {['Search', 'Dashboard', 'Library', 'Journal', 'Timeline', 'Profile'].map((label, i) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 2px' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: i === 2 ? NAV_PRIMARY_SOFT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 11, height: 11, borderRadius: 3, background: i === 2 ? NAV_PRIMARY : NAV_MUTED }} />
          </div>
          <span style={{ fontSize: 9, color: i === 2 ? NAV_PRIMARY : NAV_MUTED, fontWeight: i === 2 ? 600 : 500 }}>{label}</span>
        </div>
      ))}
    </div>
  </div>
);

const MobileNavImproved4 = () => (
  <div style={navBase}>
    <div style={{ background: NAV_BG, borderBottom: `1px solid ${NAV_BORDER}`, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontWeight: 700, fontSize: 15 }}>Library</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ width: 36, height: 36, borderRadius: 8, background: NAV_BG_SOFT, border: `1px solid ${NAV_BORDER}`, color: NAV_FG }}>🔍</button>
        <button style={{ width: 36, height: 36, borderRadius: 8, background: NAV_PRIMARY, color: NAV_BG, border: 'none', fontWeight: 700 }}>+</button>
      </div>
    </div>
    <div style={{ flex: 1, padding: 16, fontSize: 12, color: NAV_MUTED, fontStyle: 'italic', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Search lives in the top bar (consistent with desktop)
    </div>
    <div style={{ borderTop: `1px solid ${NAV_BORDER}`, background: NAV_BG, display: 'flex', justifyContent: 'space-around', padding: '8px 4px' }}>
      {['Library', 'Journal', 'Timeline', 'Profile'].map((label, i) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 12px' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: i === 0 ? NAV_PRIMARY_SOFT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: i === 0 ? NAV_PRIMARY : NAV_MUTED }} />
          </div>
          <span style={{ fontSize: 10, color: i === 0 ? NAV_PRIMARY : NAV_MUTED, fontWeight: i === 0 ? 600 : 500 }}>{label}</span>
        </div>
      ))}
    </div>
  </div>
);

const MobileNavImprovedFAB = () => (
  <div style={navBase}>
    <div style={{ background: NAV_BG, borderBottom: `1px solid ${NAV_BORDER}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 24, height: 24, borderRadius: 6, background: NAV_PRIMARY }} />
      <span style={{ fontWeight: 700, fontSize: 14 }}>SavePoint</span>
      <div style={{ marginLeft: 'auto', padding: '6px 10px', background: NAV_BG_SOFT, border: `1px solid ${NAV_BORDER}`, borderRadius: 6, fontSize: 11, color: NAV_MUTED }}>🔍 Search</div>
    </div>
    <div style={{ flex: 1, padding: 16, fontSize: 12, color: NAV_MUTED, fontStyle: 'italic', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <span>FAB hosts Add Game; tabs are 5</span>
      <button style={{ position: 'absolute', bottom: 64, right: 16, width: 48, height: 48, borderRadius: '50%', background: NAV_PRIMARY, color: NAV_BG, border: 'none', fontSize: 22, fontWeight: 700, boxShadow: '0 4px 12px oklch(0 0 0 / 0.4)' }}>+</button>
    </div>
    <div style={{ borderTop: `1px solid ${NAV_BORDER}`, background: NAV_BG, display: 'flex', justifyContent: 'space-around', padding: '8px 4px' }}>
      {['Dashboard', 'Library', 'Journal', 'Timeline', 'Profile'].map((label, i) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 6px' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: i === 1 ? NAV_PRIMARY_SOFT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: i === 1 ? NAV_PRIMARY : NAV_MUTED }} />
          </div>
          <span style={{ fontSize: 10, color: i === 1 ? NAV_PRIMARY : NAV_MUTED, fontWeight: i === 1 ? 600 : 500 }}>{label}</span>
        </div>
      ))}
    </div>
  </div>
);

Object.assign(window, {
  NavCurrentDesktop, NavCurrentMobile,
  NavImprovedDesktopGrouped, NavImprovedDesktopBreadcrumb, NavImprovedDesktopRail,
  MobileNavCurrent6, MobileNavImproved4, MobileNavImprovedFAB,
});
