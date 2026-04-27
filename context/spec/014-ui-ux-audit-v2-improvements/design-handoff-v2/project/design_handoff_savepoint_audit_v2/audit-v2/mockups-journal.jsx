// audit-v2/mockups-journal.jsx — Journal mockups

const JBG = 'oklch(0.155 0.007 260)';
const JCARD = 'oklch(0.18 0.007 260)';
const JCARD_SOFT = 'oklch(0.2 0.007 260)';
const JFG = 'oklch(0.93 0.005 250)';
const JMUTED = 'oklch(0.6 0.005 250)';
const JBORDER = 'oklch(0.24 0.008 250)';
const JPRIMARY = 'oklch(0.69 0.17 172)';

const journalBase = {
  fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  background: JBG, color: JFG, width: '100%', height: '100%', overflow: 'hidden',
};

const JCover = ({ w = 56, h = 76 }) => (
  <div style={{ width: w, height: h, borderRadius: 4, background: 'linear-gradient(135deg, oklch(0.32 0.1 250), oklch(0.24 0.07 200))', flexShrink: 0 }} />
);

// ───────── Finding 4: Journal entry detail page ─────────

const JournalDetailCurrent = () => (
  <div style={{ ...journalBase, padding: 16 }}>
    <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Untitled Entry</h1>
    <div style={{ fontSize: 9, color: JMUTED, marginBottom: 14 }}>Created 2 days ago · Updated 1 day ago</div>
    <div style={{ background: JCARD, border: `1px solid ${JBORDER}`, borderRadius: 6, padding: 10, marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Game</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <JCover w={36} h={48} />
        <div>
          <div style={{ fontSize: 10, fontWeight: 500 }}>Hollow Knight</div>
          <div style={{ fontSize: 9, color: JMUTED }}>Adventure</div>
        </div>
      </div>
    </div>
    <div style={{ background: JCARD, border: `1px solid ${JBORDER}`, borderRadius: 6, padding: 10, marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Entry</div>
      <p style={{ fontSize: 10, color: JFG, lineHeight: 1.5 }}>Beat Soul Master. The fight clicked once I stopped panicking and started watching tells. Probably my favorite boss so far.</p>
    </div>
    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
      <button style={{ padding: '5px 10px', background: 'transparent', color: JFG, border: `1px solid ${JBORDER}`, borderRadius: 5, fontSize: 9 }}>Edit</button>
      <button style={{ padding: '5px 10px', background: 'oklch(0.55 0.2 25)', color: JFG, border: 'none', borderRadius: 5, fontSize: 9 }}>Delete</button>
    </div>
  </div>
);

const JournalDetailEditorial = () => (
  <div style={{ ...journalBase, padding: 16 }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
      <JCover w={50} h={66} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, color: JMUTED, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 3 }}>Hollow Knight · 2 days ago</div>
        <h1 style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2, marginBottom: 6 }}>Soul Master clicked</h1>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, padding: '2px 6px', background: 'oklch(0.69 0.17 172 / 0.15)', color: JPRIMARY, borderRadius: 3, fontWeight: 600 }}>Proud</span>
          <span style={{ fontSize: 9, color: JMUTED }}>· 90m</span>
          <span style={{ fontSize: 9, color: JMUTED }}>· #boss #soul-master</span>
        </div>
      </div>
      <button style={{ padding: '5px 8px', background: 'transparent', color: JMUTED, border: `1px solid ${JBORDER}`, borderRadius: 4, fontSize: 9 }}>⋯</button>
    </div>
    <p style={{ fontSize: 11, color: JFG, lineHeight: 1.6, marginBottom: 12 }}>
      Beat Soul Master. The fight clicked once I stopped panicking and started watching tells. Probably my favorite boss so far.
    </p>
    <div style={{ paddingTop: 10, borderTop: `1px solid ${JBORDER}`, fontSize: 9, color: JMUTED, fontStyle: 'italic' }}>
      Entry is the focus — game is meta, not its own card. Edit/delete tucked into ⋯ menu.
    </div>
  </div>
);

const JournalDetailMargin = () => (
  <div style={{ ...journalBase, padding: 16, display: 'grid', gridTemplateColumns: '70px 1fr', gap: 16 }}>
    <div>
      <JCover w={64} h={86} />
      <div style={{ marginTop: 8, fontSize: 9, color: JMUTED, lineHeight: 1.4 }}>
        <div style={{ color: JFG, fontWeight: 500 }}>Hollow Knight</div>
        <div>2 days ago</div>
        <div style={{ marginTop: 6, padding: '2px 5px', background: 'oklch(0.69 0.17 172 / 0.15)', color: JPRIMARY, borderRadius: 3, display: 'inline-block', fontWeight: 600 }}>Proud</div>
        <div style={{ marginTop: 4 }}>90m</div>
      </div>
    </div>
    <div>
      <h1 style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.2, marginBottom: 10 }}>Soul Master clicked</h1>
      <p style={{ fontSize: 11, color: JFG, lineHeight: 1.6, marginBottom: 14 }}>
        Beat Soul Master. The fight clicked once I stopped panicking and started watching tells. Probably my favorite boss so far.
      </p>
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={{ padding: '4px 10px', background: 'transparent', color: JFG, border: `1px solid ${JBORDER}`, borderRadius: 4, fontSize: 9 }}>Edit</button>
        <button style={{ padding: '4px 10px', background: 'transparent', color: 'oklch(0.7 0.18 25)', border: `1px solid oklch(0.7 0.18 25 / 0.4)`, borderRadius: 4, fontSize: 9 }}>Delete</button>
      </div>
    </div>
  </div>
);

const JournalDetailReader = () => (
  <div style={{ ...journalBase, padding: '20px 28px' }}>
    <div style={{ fontSize: 9, color: JMUTED, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
      <JCover w={16} h={22} /> Hollow Knight · March 14
    </div>
    <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.01em', marginBottom: 14 }}>
      Soul Master clicked
    </h1>
    <p style={{ fontSize: 11, color: JFG, lineHeight: 1.7, marginBottom: 14, maxWidth: 360 }}>
      Beat Soul Master. The fight clicked once I stopped panicking and started watching tells. Probably my favorite boss so far.
    </p>
    <div style={{ display: 'flex', gap: 16, fontSize: 9, color: JMUTED, paddingTop: 10, borderTop: `1px solid ${JBORDER}` }}>
      <span><strong style={{ color: JFG }}>90m</strong> session</span>
      <span><strong style={{ color: JPRIMARY }}>Proud</strong></span>
      <span style={{ marginLeft: 'auto' }}>Edit · Delete</span>
    </div>
  </div>
);

// ───────── Finding 5: Journal timeline list ─────────

const JournalListCurrent = () => (
  <div style={{ ...journalBase, padding: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
      <h2 style={{ fontSize: 14, fontWeight: 600 }}>Journal Entries</h2>
      <button style={{ padding: '4px 10px', background: JCARD, color: JFG, border: `1px solid ${JBORDER}`, borderRadius: 4, fontSize: 9 }}>Write New Entry</button>
    </div>
    {[
      { title: 'Soul Master clicked', game: 'Hollow Knight', date: '2 days ago', mood: 'Proud' },
      { title: 'Stuck on Watcher Knights', game: 'Hollow Knight', date: '4 days ago', mood: 'Fried' },
      { title: 'Untitled Entry', game: 'Celeste', date: '1 week ago', mood: null },
    ].map((e, i) => (
      <div key={i} style={{ background: JCARD, border: `1px solid ${JBORDER}`, borderRadius: 6, padding: 10, marginBottom: 8, display: 'flex', gap: 8 }}>
        <JCover w={32} h={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{e.title}</div>
          <div style={{ fontSize: 9, color: JMUTED, marginBottom: 4 }}>{e.date}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 500 }}>{e.game}</span>
            {e.mood && <span style={{ fontSize: 8, padding: '1px 5px', background: JCARD_SOFT, borderRadius: 3 }}>{e.mood}</span>}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const JournalListGrouped = () => (
  <div style={{ ...journalBase, padding: 16 }}>
    <div style={{ display: 'flex', gap: 6, marginBottom: 14, fontSize: 9 }}>
      <span style={{ padding: '4px 10px', background: JPRIMARY, color: JBG, borderRadius: 999, fontWeight: 600 }}>All</span>
      <span style={{ padding: '4px 10px', background: JCARD, color: JMUTED, borderRadius: 999, border: `1px solid ${JBORDER}` }}>By game</span>
      <span style={{ padding: '4px 10px', background: JCARD, color: JMUTED, borderRadius: 999, border: `1px solid ${JBORDER}` }}>This month</span>
    </div>
    <div style={{ fontSize: 9, color: JMUTED, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>This Week</div>
    {[
      { title: 'Soul Master clicked', game: 'Hollow Knight', date: 'Tue', dur: '90m', mood: 'Proud' },
      { title: 'Stuck on Watcher Knights', game: 'Hollow Knight', date: 'Sun', dur: '45m', mood: 'Fried' },
    ].map((e, i) => (
      <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `1px solid ${JBORDER}` }}>
        <div style={{ width: 28, fontSize: 9, color: JMUTED, fontVariantNumeric: 'tabular-nums', paddingTop: 2 }}>{e.date}</div>
        <JCover w={28} h={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 500, marginBottom: 2 }}>{e.title}</div>
          <div style={{ fontSize: 9, color: JMUTED }}>{e.game} · {e.dur} · <span style={{ color: JPRIMARY }}>{e.mood}</span></div>
        </div>
      </div>
    ))}
    <div style={{ fontSize: 9, color: JMUTED, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, margin: '14px 0 6px' }}>Last Week</div>
    <div style={{ display: 'flex', gap: 10, padding: '8px 0' }}>
      <div style={{ width: 28, fontSize: 9, color: JMUTED, paddingTop: 2 }}>Mar 6</div>
      <JCover w={28} h={38} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 500 }}>Untitled Entry</div>
        <div style={{ fontSize: 9, color: JMUTED }}>Celeste</div>
      </div>
    </div>
  </div>
);

const JournalListByGame = () => (
  <div style={{ ...journalBase, padding: 16 }}>
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <JCover w={28} h={38} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600 }}>Hollow Knight</div>
          <div style={{ fontSize: 9, color: JMUTED }}>4 entries · 12h logged</div>
        </div>
        <button style={{ padding: '3px 8px', background: 'transparent', color: JMUTED, border: `1px solid ${JBORDER}`, borderRadius: 4, fontSize: 9 }}>+ Log</button>
      </div>
      <div style={{ borderLeft: `2px solid ${JBORDER}`, marginLeft: 10, paddingLeft: 12 }}>
        {[
          { t: 'Soul Master clicked', d: 'Tue · 90m' },
          { t: 'Stuck on Watcher Knights', d: 'Sun · 45m' },
          { t: 'Greenpath cleared', d: 'Mar 5 · 60m' },
        ].map((e, i) => (
          <div key={i} style={{ padding: '5px 0', fontSize: 10, borderBottom: i === 2 ? 'none' : `1px solid ${JBORDER}` }}>
            <div style={{ fontWeight: 500 }}>{e.t}</div>
            <div style={{ fontSize: 9, color: JMUTED }}>{e.d}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
      <JCover w={28} h={38} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 600 }}>Celeste</div>
        <div style={{ fontSize: 9, color: JMUTED }}>1 entry · 2h logged</div>
      </div>
    </div>
  </div>
);

const JournalListCalendar = () => (
  <div style={{ ...journalBase, padding: 16 }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 14 }}>
      {Array.from({ length: 28 }).map((_, i) => {
        const has = [3, 5, 9, 12, 13, 18, 22].includes(i);
        const intense = [12, 13, 22].includes(i);
        return (
          <div key={i} style={{ aspectRatio: '1', borderRadius: 3, background: has ? (intense ? JPRIMARY : 'oklch(0.69 0.17 172 / 0.4)') : JCARD, border: `1px solid ${JBORDER}` }} />
        );
      })}
    </div>
    <div style={{ fontSize: 9, color: JMUTED, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Mar 14 · Selected</div>
    <div style={{ background: JCARD, border: `1px solid ${JBORDER}`, borderRadius: 5, padding: 8, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
      <JCover w={24} h={32} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 500 }}>Soul Master clicked</div>
        <div style={{ fontSize: 9, color: JMUTED }}>Hollow Knight · 90m</div>
      </div>
    </div>
  </div>
);

Object.assign(window, {
  JCover,
  JournalDetailCurrent, JournalDetailEditorial, JournalDetailMargin, JournalDetailReader,
  JournalListCurrent, JournalListGrouped, JournalListByGame, JournalListCalendar,
});
