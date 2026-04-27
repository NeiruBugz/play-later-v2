// audit-v2/audit-app.jsx — main audit document

const { useState } = React;

const FINDINGS = [
  {
    id: 'finding-1',
    severity: 'high',
    area: 'Information Architecture',
    title: 'Search is the only way into IGDB, but it lives in 3 different places',
    description:
      'Search is the entry point for adding any new game — yet it appears as a top-bar field on desktop, a bottom-nav tab on mobile, and behind a separate "Add Game" button on the dashboard. Three surfaces, no single mental anchor.',
    impact: [
      ['negative', 'Users hunt for the input on first run — different placements break learnability across breakpoints.'],
      ['negative', 'Mobile bottom nav loses 1/6 of its slots to Search instead of a content surface.'],
      ['neutral', 'The triple placement also means search state is not a shared route — deep-linking a query is awkward.'],
    ],
    recommendation:
      'Treat search as a global shortcut (⌘K + persistent top-bar input on desktop, single icon button on mobile) — not as a navigation destination. Free up the bottom nav for content surfaces and let "Add Game" simply open the same search overlay.',
    canvas: [
      { id: 'nav-current', label: 'Current — desktop nav', cmp: 'NavCurrentDesktop', w: 540, h: 220 },
      { id: 'nav-mobile', label: 'Current — mobile nav', cmp: 'NavCurrentMobile', w: 280, h: 460 },
      { id: 'nav-grouped', label: 'V1 — grouped + ⌘K search', cmp: 'NavImprovedDesktopGrouped', w: 540, h: 220 },
      { id: 'nav-bread', label: 'V2 — breadcrumb + tabs', cmp: 'NavImprovedDesktopBreadcrumb', w: 540, h: 220 },
      { id: 'nav-rail', label: 'V3 — left rail', cmp: 'NavImprovedDesktopRail', w: 540, h: 220, picked: true },
    ],
    pinned: 'Left rail (V3) chosen as the desktop shell — also unlocks a Raycast-style command center for global search.',
  },
  {
    id: 'finding-2',
    severity: 'high',
    area: 'Mobile · IA',
    title: 'Mobile bottom nav has 6 tabs — over the recommended ceiling',
    description:
      'Search, Dashboard, Library, Journal, Timeline, Profile all share the bottom bar. iOS HIG and Material both cap tab bars at 5; six items mean labels truncate, hit targets shrink under 44pt, and the user can\'t scan the bar in one glance.',
    impact: [
      ['negative', 'Hit targets fall below the 44pt minimum on common phone widths (375–390px).'],
      ['negative', 'Cognitive load: 6 same-weight choices = no visual primary.'],
      ['neutral', 'Dashboard and Timeline arguably overlap — Timeline is an aggregated view of activity, Dashboard is a "home" snapshot of activity.'],
    ],
    recommendation:
      'Hold the line at 4–5 tabs. Move Search into a top-bar icon. Either fold Dashboard into a "Home" landing for Library, or fold Timeline into Journal. Promote "Add Game" to a FAB if the action is high-frequency.',
    canvas: [
      { id: 'mob-current', label: 'Current — 6 tabs', cmp: 'MobileNavCurrent6', w: 300, h: 480 },
      { id: 'mob-4', label: 'V1 — 4 tabs + top search', cmp: 'MobileNavImproved4', w: 300, h: 480, picked: true },
      { id: 'mob-fab', label: 'V2 — 5 tabs + FAB', cmp: 'MobileNavImprovedFAB', w: 300, h: 480 },
    ],
    pinned: 'Mobile V1 chosen — 4 tabs (Library / Journal / Timeline / Profile) with search promoted to the top bar.',
  },
  {
    id: 'finding-3',
    severity: 'high',
    area: 'Game detail',
    title: 'Game detail hierarchy: title moment competes with sticky sidebar and banner gradient',
    description:
      'On a game detail page the title is what the user came for, but the page allocates: a tall gradient banner on top, a sticky sidebar with "Library Status" heading, then the title in the right column. The title sits below the visual fold of attention; the sidebar reads as the page\'s subject.',
    impact: [
      ['negative', 'First glance lands on a generic gradient strip and a "Library Status" heading instead of the game title.'],
      ['negative', 'Title + cover are visually dissociated — the cover lives in the sidebar, the title in a separate column.'],
      ['negative', 'On mobile, the sidebar stacks above the description — pushing the synopsis below the fold.'],
    ],
    recommendation:
      'Put cover + title + status in a single hero lockup. Make the cover and title a single visual unit; let status, rating, and key actions sit beside or below the title at the same hierarchy level. Banner gradient is optional decoration, not structural.',
    canvas: [
      { id: 'det-current', label: 'Current — banner + sticky sidebar', cmp: 'DetailCurrent', w: 480, h: 320 },
      { id: 'det-hero', label: 'V1 — unified hero lockup', cmp: 'DetailImprovedHero', w: 480, h: 320, picked: true },
      { id: 'det-hero-mob', label: 'V1 applied — mobile', cmp: 'DetailImprovedHeroMobile', w: 320, h: 460, picked: true },
      { id: 'det-split', label: 'V2 — clean two-column', cmp: 'DetailImprovedSplit', w: 480, h: 320 },
      { id: 'det-stack', label: 'V3 — vertical hero (mobile-first)', cmp: 'DetailImprovedStacked', w: 320, h: 380 },
    ],
    pinned: 'V1 unified hero chosen — cover, title, status, rating in a single lockup. Mobile variant added: same lockup, banner shrinks, cover overlaps the gradient.',
    implementationFixes: {
      file: 'features/game-detail/ui/game-detail-hero.tsx',
      intro: 'The current build renders a banner zone, then a separate cover/title block beneath it — two zones, not one lockup. The fixes below pull V1 back into shape.',
      items: [
        ['layout', 'Cover must overlap the banner, not sit below it. Reduce the content wrapper top padding so the cover\'s top sits ~30–40% inside the banner and its bottom edge aligns with the banner\'s bottom edge. Currently pt-24 sm:pt-28 pushes the lockup entirely below.'],
        ['layout', 'Tighten the banner gradient stops so the bottom ~30% of the banner is solid var(--background). The cover should read as punched through the banner, not floating beneath a faded photo.'],
        ['layout', 'Bottom-align cover and title block (sm:items-end is correct). Drop the title block\'s space-y-3 to space-y-2 so status pills sit close to the title and the lockup ends at the cover\'s bottom edge.'],
        ['content', 'Add a meta eyebrow line above the <h1>: "{releaseYear} · {primaryStudio}" (or "{releaseYear} · {primaryPlatform}" if studio missing). Small uppercase, tracking-wide, var(--muted). This is what makes the title feel anchored instead of floating.'],
        ['layout', 'Title row currently flex-wraps with status on the left and rating on the far right — kills the lockup feel. Group status pill + rating + ⋯ into one inline cluster, all left-aligned, gap-2. No flex-1 spacer between status and rating.'],
        ['type', 'Cover/title size ratio is off — text-display next to a w-40 cover makes the title look stranded. Either bump cover to w-40/w-48/w-56 across breakpoints, or scale the title down one display step on this surface. (V1 used cover ≈ 4× the title cap-height.)'],
        ['structure', 'Add a tab strip directly under the hero (Overview · Journal · Playtime · Related) with a 1px border-b separator. This anchors the hero as its own zone and stops the description/genres/platforms from spilling straight into it.'],
        ['mobile', 'On mobile (text-center, items-center stack), keep the same overlap pattern: shorter banner (h-32), cover overlaps ~50%, title + meta + status stack centered below. Don\'t fall back to the old "banner then content" stack on small screens.'],
      ],
    },
  },
  {
    id: 'finding-4',
    severity: 'medium',
    area: 'Game detail',
    title: '"Library Status" card is overbuilt for a status pill and a rating',
    description:
      'The sidebar card stacks: a "Library Status" heading, a status pill, "Your rating" label + stars, an "Updated" timestamp, and a "Manage Library" button that opens a separate modal. Most of it is chrome — a single status pill and 5 stars don\'t need a titled card and a button to a second screen.',
    impact: [
      ['negative', 'Two-step flow (button → modal) for what should be a one-tap status change.'],
      ['negative', 'Card title repeats info already implied by location ("on a game page, this is its library status").'],
      ['neutral', 'The "Updated: ..." line is rarely useful for a personal status.'],
    ],
    recommendation:
      'Replace the card with inline controls. Status as a clickable pill that opens a quick menu, rating as inline interactive stars, log-session as a primary inline button. Reserve modals for true secondary flows like notes or custom shelves.',
    canvas: [
      { id: 'st-current', label: 'Current — card + modal', cmp: 'StatusCardCurrent', w: 280, h: 360 },
      { id: 'st-inline', label: 'V1 — inline pill + stars', cmp: 'StatusCardImprovedInline', w: 280, h: 360 },
      { id: 'st-seg', label: 'V2 — segmented status', cmp: 'StatusCardImprovedSegmented', w: 280, h: 360 },
      { id: 'st-actions', label: 'V3 — action group', cmp: 'StatusCardImprovedActionGroup', w: 280, h: 360 },
      { id: 'st-page-inline', label: 'V1 in context — dropdown pill', cmp: 'StatusPageInline', w: 320, h: 460 },
      { id: 'st-page-seg', label: 'V2 in context — segmented (6+ statuses)', cmp: 'StatusPageSegmented', w: 320, h: 460, picked: true },
    ],
    pinned: 'V2 segmented chosen, with one caveat: with 6+ statuses we let the row scroll horizontally on narrow viewports. V1 (dropdown pill) is the fallback if the scroll feels rough in test.',
  },
  {
    id: 'finding-5',
    severity: 'high',
    area: 'Journal',
    title: 'Journal entry detail page reads as a form, not as the entry',
    description:
      'The entry detail page renders two stacked cards labelled "Game" and "Entry", each with a section heading. The body text — the actual journal entry — sits inside the second card, sandwiched between framing chrome. Edit and Delete buttons live at the bottom of the page, with Delete in destructive red as a peer to Edit.',
    impact: [
      ['negative', 'The entry itself isn\'t the visual focus — the cards and headings are.'],
      ['negative', 'Destructive Delete sits adjacent to Edit with no confirmation pattern; one slip = data loss.'],
      ['negative', '"Game" header is filler — the relationship is implicit and could be a metadata line.'],
    ],
    recommendation:
      'Treat the page as a reading view: prominent title, entry text as the dominant element, game + mood + tags as a metadata line. Move destructive actions behind a ⋯ menu or a confirmation. Untitled entries should auto-derive a title from the first line or fall back to date + game.',
    canvas: [
      { id: 'jd-current', label: 'Current — stacked cards', cmp: 'JournalDetailCurrent', w: 320, h: 400 },
      { id: 'jd-edit', label: 'V1 — editorial header', cmp: 'JournalDetailEditorial', w: 320, h: 400, picked: true },
      { id: 'jd-margin', label: 'V2 — margin metadata', cmp: 'JournalDetailMargin', w: 320, h: 400 },
      { id: 'jd-reader', label: 'V3 — long-form reader', cmp: 'JournalDetailReader', w: 320, h: 400 },
    ],
    pinned: 'V1 editorial header chosen — entry title is the focus, game/mood/duration as a metadata line, destructive actions tucked into ⋯.',
  },
  {
    id: 'finding-6',
    severity: 'medium',
    area: 'Journal',
    title: 'Populated journal list lacks structure — no grouping, no filter, no rhythm',
    description:
      'The journal list is a flat stack of identical cards. Empty state has personality; populated state is a wall. Three weeks of entries look identical to three months. Without grouping (by date, by game) or filters (mood, tag, status), the list scales badly.',
    impact: [
      ['negative', 'No way to scan "what did I play this month" or "what about Hollow Knight specifically".'],
      ['negative', 'Long lists become indistinguishable — every entry has equal visual weight.'],
      ['neutral', 'Calendar / heatmap is a natural visualization for a journaling product but isn\'t present.'],
    ],
    recommendation:
      'Add at least one grouping affordance — date sections by default, with a toggle to group by game. Surface a filter row for mood/tag/status. Consider a heatmap calendar for the Timeline view.',
    canvas: [
      { id: 'jl-current', label: 'Current — flat list', cmp: 'JournalListCurrent', w: 320, h: 400 },
      { id: 'jl-group', label: 'V1 — grouped by week', cmp: 'JournalListGrouped', w: 320, h: 400 },
      { id: 'jl-game', label: 'V2 — grouped by game', cmp: 'JournalListByGame', w: 320, h: 400, picked: true },
      { id: 'jl-cal', label: 'V3 — calendar heatmap', cmp: 'JournalListCalendar', w: 320, h: 400 },
    ],
    pinned: 'V2 grouped-by-game chosen. Heatmap parked — nice but overkill for this surface; revisit for a future Stats / Year-in-Review view.',
  },
  {
    id: 'finding-7',
    severity: 'medium',
    area: 'Profile',
    title: 'Profile header stacks Edit, Logout, email and stats — proportions are off',
    description:
      'The profile header puts a large avatar next to a vertical stack: name, handle, follower counts, email address, then two outlined buttons (Edit Profile, Logout). The result is a tall block with a logout button visible on every profile view, and a private email rendered next to public stats.',
    impact: [
      ['negative', 'Logout is a low-frequency, account-level action — it doesn\'t belong in the persistent profile header.'],
      ['negative', 'Email is private — should never render on a public profile by default.'],
      ['negative', 'Visual rhythm: name + handle + stats + email + 2 buttons is 5 zones with no hierarchy.'],
    ],
    recommendation:
      'Move Logout to settings or a user menu. Remove email from the public profile. Collapse stats to one line of inline metadata. Reserve a single "Edit profile" button for the owner; show a "Follow" button to others.',
    canvas: [
      { id: 'ph-current', label: 'Current — stacked', cmp: 'ProfileHeaderCurrent', w: 360, h: 320 },
      { id: 'ph-banner', label: 'V1 — banner + overlap', cmp: 'ProfileHeaderBanner', w: 360, h: 320, picked: true },
      { id: 'ph-compact', label: 'V2 — single-line meta', cmp: 'ProfileHeaderCompact', w: 360, h: 320 },
      { id: 'ph-hero', label: 'V3 — centered hero', cmp: 'ProfileHeaderHero', w: 360, h: 320 },
    ],
    pinned: 'V1 banner + overlap chosen — keeps room for personality without crowding the form. Logout moves to settings; email never on public profile.',
  },
  {
    id: 'finding-8',
    severity: 'low',
    area: 'IA · Visual',
    title: 'Profile sub-tabs use the same underline treatment as the main app nav',
    description:
      'The main app nav and the profile sub-tabs both render as underlined text tabs with similar weight and indicator. They sit one above the other on the profile page, creating two parallel tab bars at the same visual rank — the user can\'t tell which controls page navigation and which controls in-page view.',
    impact: [
      ['negative', 'No hierarchy between "navigate to a different page" vs "switch a view in this page".'],
      ['neutral', 'Indicator color and underline thickness happen to differ slightly, but not enough to read as different.'],
    ],
    recommendation:
      'Use a different control type for in-page view switching. Segmented control or pill set both clearly read as "filter inside this page" rather than "navigate elsewhere". Keep underline tabs reserved for top-level routes.',
    canvas: [
      { id: 'tn-current', label: 'Current — two underlines', cmp: 'TabNavCurrent', w: 360, h: 280 },
      { id: 'tn-seg', label: 'V1 — segmented sub-nav', cmp: 'TabNavSegmented', w: 360, h: 280, picked: true },
      { id: 'tn-pill', label: 'V2 — pill sub-nav', cmp: 'TabNavPills', w: 360, h: 280 },
    ],
    pinned: 'V1 segmented sub-nav chosen — visually distinct from underline tabs at the page level, signals an in-page view switch.',
  },
  {
    id: 'finding-9',
    severity: 'medium',
    area: 'Brand · Auth',
    title: 'Auth page is a generic centered form with a generic tagline',
    description:
      'The sign-in page renders a centered card with the wordmark on top and "Manage your gaming experiences" — a phrase that could describe Steam, Backloggd, GOG Galaxy, or any of a dozen competitors. For a product that lives or dies on emotional connection to a backlog, the auth screen sets no tone.',
    impact: [
      ['negative', 'Zero brand differentiation at the most important first impression.'],
      ['negative', 'Tagline could describe any game library tool — fails the "would this fit a competitor logo" test.'],
      ['neutral', 'The centered-card pattern is fine; the content is the issue.'],
    ],
    recommendation:
      'Lead with a concrete promise tied to journaling and personal history. Use a split layout to give brand voice room without crowding the form, or commit to a minimal editorial layout that uses type as the brand.',
    canvas: [
      { id: 'au-current', label: 'Current — centered card', cmp: 'AuthCurrent', w: 360, h: 420 },
      { id: 'au-split', label: 'V1 — split with promise', cmp: 'AuthSplitImage', w: 480, h: 320 },
      { id: 'au-min', label: 'V2 — minimal editorial', cmp: 'AuthMinimal', w: 360, h: 420, picked: true },
      { id: 'au-edit', label: 'V3 — long-form editorial', cmp: 'AuthEditorial', w: 360, h: 420 },
    ],
    pinned: 'V2 minimal editorial chosen — keep it quiet, let type carry the brand. Skip the marketing copy.',
  },
  {
    id: 'finding-10',
    severity: 'medium',
    area: 'Settings',
    title: 'Settings is a single form in a card — no room to grow',
    description:
      'The Settings page is currently one card with avatar + username + Save button. Real settings will need privacy, connected accounts (Steam/IGDB sync), notifications, data export, and account deletion. The current layout has no IA hook for any of that.',
    impact: [
      ['neutral', 'Today the page works. The concern is tomorrow — every new settings group will pile into the same card or sprout a new card with no system.'],
      ['negative', 'No section headings, no left rail, no accordion — nothing to extend into.'],
    ],
    recommendation:
      'Pick a settings shell now. Sectioned list (mobile-first), left-rail (desktop-first), or accordion all work; just commit to one. Reserve a "Danger zone" pattern for destructive actions.',
    canvas: [
      { id: 'se-current', label: 'Current — single card', cmp: 'SettingsCurrent', w: 360, h: 360 },
      { id: 'se-section', label: 'V1 — sectioned list', cmp: 'SettingsSectioned', w: 360, h: 360 },
      { id: 'se-side', label: 'V2 — left rail', cmp: 'SettingsSidebar', w: 480, h: 320, picked: true },
      { id: 'se-acc', label: 'V3 — accordion', cmp: 'SettingsAccordion', w: 360, h: 360 },
    ],
    pinned: 'Left rail (V2) chosen — consistent with the new global desktop rail shell.',
  },
  {
    id: 'finding-11',
    severity: 'low',
    area: 'Visual polish',
    title: 'Mood and tag chips on journal cards have inconsistent affordance',
    description:
      'Mood is rendered as a colored Badge. Tags are rendered as plain muted text prefixed with <code>#</code>. They sit side-by-side on every card but signal completely different things visually — one looks tappable, the other looks like a hashtag in body copy.',
    impact: [
      ['negative', 'Tags look like text, not filters — users may not realize they can be clicked.'],
      ['neutral', 'Mood as a strong pill is correct; tags being weaker than mood is also correct (mood is primary).'],
    ],
    recommendation:
      'Use the same primitive — chip — for both, but vary the visual fill to encode role: filled chip for mood, outlined chip for tag. Drop the literal <code>#</code> prefix; let shape do the work.',
    canvas: [
      { id: 'ch-current', label: 'Current', cmp: 'ChipsCurrent', w: 300, h: 220 },
      { id: 'ch-unified', label: 'V1 — unified chip primitive', cmp: 'ChipsUnified', w: 300, h: 220 },
      { id: 'ch-sep', label: 'V2 — mood as eyebrow', cmp: 'ChipsSeparated', w: 300, h: 220, picked: true },
    ],
    pinned: 'V2 chosen — mood elevated to a header eyebrow (it sets the tone of the entry); tags become outlined chips below.',
  },
  {
    id: 'finding-12',
    severity: 'medium',
    area: 'Visual polish',
    title: 'Page-level heading sizes drift across pages — no enforced scale',
    description:
      'Library uses a 22px heading. Profile uses an 18px heading. Settings uses a 16px section title for what is effectively a page header. Body copy similarly drifts between 10, 11, and 12px depending on the screen. There\'s no shared type scale being enforced.',
    impact: [
      ['negative', 'Pages feel like they were built by different people — no shared rhythm.'],
      ['negative', 'Hierarchy is unreadable: at a glance, is this an H1 or an H2?'],
      ['neutral', 'Tailwind utilities make this easy to drift — every component picks its own size.'],
    ],
    recommendation:
      'Define a 6-stop type scale (display, h1, h2, h3, body, caption) with assigned roles, document where each goes ("h1 = page title, one per page"), and refactor existing pages onto it.',
    canvas: [
      { id: 'tp-current', label: 'Current — drifted', cmp: 'TypeCurrent', w: 360, h: 320 },
      { id: 'tp-scale', label: 'V1 — proposed scale', cmp: 'TypeScale', w: 480, h: 360, picked: true },
      { id: 'tp-applied', label: 'V2 — scale applied', cmp: 'TypeApplied', w: 360, h: 360 },
      { id: 'tp-alt', label: 'V3 — editorial alt', cmp: 'TypeAlt', w: 360, h: 320 },
    ],
    pinned: 'V1 proposed 6-stop scale chosen — document roles, refactor pages onto it.',
  },
];

const SEVERITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low', critical: 'Critical' };

const SeverityBadge = ({ severity }) => (
  <span className={`severity-badge severity-${severity}`}>
    <span className="severity-dot" />{SEVERITY_LABEL[severity]}
  </span>
);

const ImpactItem = ({ kind, children }) => {
  const sym = kind === 'positive' ? '+' : kind === 'negative' ? '−' : '·';
  return (
    <li className="impact-item">
      <span className={`impact-icon impact-${kind}`}>{sym}</span>
      <span dangerouslySetInnerHTML={{ __html: children }} />
    </li>
  );
};

const FindingCanvas = ({ finding }) => {
  const { DesignCanvas, DCSection, DCArtboard } = window;
  if (!DesignCanvas) return null;
  return (
    <div className="canvas-wrap">
      <DesignCanvas storageKey={`audit-v2-${finding.id}`} initialZoom={0.9} minHeight={520}>
        <DCSection id={finding.id} title={finding.title}>
          {finding.canvas.map((art) => {
            const Cmp = window[art.cmp];
            const labelEl = art.picked
              ? <span>{art.label} <span className="picked-badge">📌 Picked</span></span>
              : art.label;
            return (
              <DCArtboard key={art.id} id={art.id} label={labelEl} width={art.w} height={art.h}>
                {Cmp ? <Cmp /> : <div style={{ padding: 16, color: '#888' }}>Missing: {art.cmp}</div>}
              </DCArtboard>
            );
          })}
        </DCSection>
      </DesignCanvas>
    </div>
  );
};

const FindingCard = ({ finding, index }) => (
  <article className="finding-card" id={finding.id}>
    <div className="finding-meta">
      <SeverityBadge severity={finding.severity} />
      <span className="area-tag">{finding.area}</span>
      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: 'auto' }}>Finding {String(index + 1).padStart(2, '0')}</span>
    </div>
    <h3 className="finding-title">{finding.title}</h3>
    <p className="finding-description">{finding.description}</p>
    <div className="finding-section-title">Impact</div>
    <ul className="impact-list">
      {finding.impact.map(([kind, text], i) => (
        <ImpactItem key={i} kind={kind}>{text}</ImpactItem>
      ))}
    </ul>
    <div className="recommendation-box">
      <div className="recommendation-title">Recommendation</div>
      <div className="recommendation-text" dangerouslySetInnerHTML={{ __html: finding.recommendation }} />
    </div>
    {finding.pinned && (
      <div className="pinned-box">
        <div className="pinned-title"><span className="pinned-pin">📌</span> Pinned decision</div>
        <div className="pinned-text">{finding.pinned}</div>
      </div>
    )}
    {finding.implementationFixes && (
      <div className="fixes-box">
        <div className="fixes-header">
          <div className="fixes-title">🔧 Implementation fixes</div>
          {finding.implementationFixes.file && (
            <code className="fixes-file">{finding.implementationFixes.file}</code>
          )}
        </div>
        {finding.implementationFixes.intro && (
          <div className="fixes-intro">{finding.implementationFixes.intro}</div>
        )}
        <ol className="fixes-list">
          {finding.implementationFixes.items.map(([tag, text], i) => (
            <li key={i} className="fixes-item">
              <span className={`fixes-tag fixes-tag-${tag}`}>{tag}</span>
              <span className="fixes-text">{text}</span>
            </li>
          ))}
        </ol>
      </div>
    )}
    <div className="finding-section-title" style={{ marginTop: '1.75rem' }}>Variations on a canvas</div>
    <FindingCanvas finding={finding} />
  </article>
);

const App = () => {
  const counts = FINDINGS.reduce((a, f) => ({ ...a, [f.severity]: (a[f.severity] || 0) + 1 }), {});
  return (
    <>
      <header className="page-header">
        <div className="header-content">
          <div className="eyebrow">UI/UX Audit · Round 2</div>
          <h1>SavePoint design audit, vol. II</h1>
          <p className="subtitle">
            A second-pass review focused on areas the first audit didn&apos;t cover: game detail, journal,
            profile &amp; settings, auth, and the navigational connective tissue between them.
            Every finding ships with the current state plus three or more variations on a canvas so you
            can compare directions side-by-side.
          </p>
          <div className="meta-grid">
            <div className="meta-item"><span className="meta-label">Scope</span><span className="meta-value">Game detail · Journal · Profile · Auth · Settings · Nav</span></div>
            <div className="meta-item"><span className="meta-label">Findings</span><span className="meta-value">{FINDINGS.length}</span></div>
            <div className="meta-item"><span className="meta-label">Method</span><span className="meta-value">Source review · heuristic walk-through</span></div>
            <div className="meta-item"><span className="meta-label">Audit volume</span><span className="meta-value">II / II</span></div>
          </div>
        </div>
      </header>

      <div className="container">
        <section className="section">
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-number">{FINDINGS.length}</div>
              <div className="summary-label">Findings across 6 surfaces</div>
            </div>
            <div className="summary-card">
              <div className="summary-number" style={{ color: 'var(--warning)' }}>{counts.high || 0}</div>
              <div className="summary-label">High severity</div>
            </div>
            <div className="summary-card">
              <div className="summary-number" style={{ color: 'var(--primary)' }}>{counts.medium || 0}</div>
              <div className="summary-label">Medium severity</div>
            </div>
            <div className="summary-card">
              <div className="summary-number" style={{ color: 'var(--success)' }}>{counts.low || 0}</div>
              <div className="summary-label">Low / polish</div>
            </div>
          </div>

          <div className="toc">
            <h3>Table of contents</h3>
            <ul className="toc-list">
              {FINDINGS.map((f, i) => (
                <li key={f.id} className="toc-item">
                  <span className="toc-num">{String(i + 1).padStart(2, '0')}</span>
                  <a href={`#${f.id}`} className="toc-link">
                    {f.title}
                    {f.pinned && <span className="picked-badge" style={{ marginLeft: 6 }}>📌 Pinned</span>}
                  </a>
                  <SeverityBadge severity={f.severity} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <h2>Pinned decisions</h2>
            <p className="section-description">Directions you&apos;ve locked in while reviewing. The rest of the audit is still open for input.</p>
          </div>
          <div className="pinned-summary">
            {FINDINGS.filter(f => f.pinned).map((f, i) => (
              <a key={f.id} href={`#${f.id}`} className="pinned-summary-card">
                <div className="pinned-summary-num">📌 #{FINDINGS.indexOf(f) + 1}</div>
                <div className="pinned-summary-title">{f.title}</div>
                <div className="pinned-summary-decision">{f.pinned}</div>
              </a>
            ))}
            <div className="pinned-summary-card pinned-summary-extra">
              <div className="pinned-summary-num">＋ Direction</div>
              <div className="pinned-summary-title">Command center (Raycast-style)</div>
              <div className="pinned-summary-decision">Global ⌘K palette to host search, navigation, and quick actions — pairs naturally with the new desktop left rail.</div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <h2>Findings</h2>
            <p className="section-description">
              Each finding pairs a written diagnosis with a side-by-side canvas of the current state and
              three or more directions. Open any artboard fullscreen for a closer look.
            </p>
          </div>
          {FINDINGS.map((f, i) => <FindingCard key={f.id} finding={f} index={i} />)}
        </section>

        <section className="section">
          <div className="section-header">
            <h2>What this audit is — and isn&apos;t</h2>
          </div>
          <div className="finding-card" style={{ marginBottom: 0 }}>
            <p style={{ marginBottom: '0.875rem', color: 'var(--muted)', fontSize: '0.95rem' }}>
              This is a heuristic review, not user research. Every finding here is a hypothesis based on
              source code and interaction patterns, not validated behavior. The goal is to surface places
              where the design has drifted from the product&apos;s positioning, where chrome is doing more
              work than content, and where IA decisions deserve a second look.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
              Variation count per finding (3–4) is intentionally generous — most findings have a clear
              recommended direction, but the alternates are there so you can mix-and-match traits across
              variations rather than picking one whole.
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
