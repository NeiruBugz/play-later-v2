# Tasks: Design reset (spec 027)

- **Functional spec:** [functional-spec.md](./functional-spec.md)
- **Technical spec:** [technical-considerations.md](./technical-considerations.md)
- **Precondition:** spec 026 has shipped (merged and released). Do not start Slice 1 before that.

Conventions for every slice:
- Paths are relative to `savepoint-tanstack/` unless they say otherwise.
- **The gate:** `pnpm --filter savepoint-tanstack format:check && lint && typecheck && test:unit && test:integration && build`. Every slice ends with it green.
- **Starting the app for a Verify task:**
  - `docker compose up -d`, then `pnpm --filter savepoint-tanstack dev` (port 6060) in the background.
  - Record the dev-server PID when starting it, and stop the server with `kill <PID>` at the end. Never pipe a daemon's stop command into another command.
  - Sign in with the local credentials provider (`AUTH_ENABLE_CREDENTIALS=true`) against the seeded dev DB.
- **Review images** are kept on purpose; they are the owner's review material, not throwaway verification artifacts. They live under `context/spec/027-design-reset/review/`, which is gitignored. Everything else a Verify task produces (extra screenshots, traces, temporary scripts) is deleted at the end of that task.
- **Comparison captures** always run with `--reseed`, which restores the seeded audit accounts first. Interactive checks that change data run before the capture, not after it.
  - In `review/phase1/before`, three screens were captured mid-animation: `quick-search`, `library-remove-confirm` and `library-filters-sheet-dark`. Compare them by eye, not by pixel diff.
- **Release markers:** Slices 2–6 together form **Release 1** (library swap, no visual change). Slices 7–15 form **Release 2** (phase 1). Slices 16–22 form **Release 3** (phase 2).

---

- [x] **Slice 1: Review script produces the phase-1 "before" set and phone checks**
  - [x] Re-count the research-notes inventory on the post-026 code and append a dated "post-026 re-count" section to `context/spec/027-design-reset/research-notes.md`. Cover: semantic spacing/typography uses, `asChild`, trigger call sites, `onSelect`, `onInteractOutside`, cover treatments, status-chip implementations, `// LABEL` strings, `text-[10px]/[11px]`, and native `<button>`. **[Agent: react-frontend]**
  - [x] Add `@playwright/test` as an exact-pinned devDependency (dev-only, not a CI test tier) and install Chromium.
    - Create `scripts/design-review/capture.ts` and a screen list `scripts/design-review/screens.ts`. The list covers every screen in functional-spec §2.0, including the empty, loading, error and not-found states that can be reached with seeded data.
    - The script signs in through the credentials provider. It writes PNGs to `context/spec/027-design-reset/review/<phase>/<before|after>/<phone|desktop>/<screen>-<light|dark>.png`: phone at 390×844 always, desktop at 1440×900 behind a `--desktop` flag.
    - Add `context/spec/027-design-reset/review/` to the repo `.gitignore`. **[Agent: testing]**
  - [x] Add the automated phone checks to the same script, run at 360×780, 390×844 and 430×932 on every screen. Reuse `.claude/skills/verify-ui/scripts/check-overflow.js` and `check-clickable.js` through `page.evaluate`.
    - No horizontal page scroll (`scrollWidth <= innerWidth`).
    - Every interactive element is at least 44×44.
    - No visible text has a computed font size below 12px.
    - Body text is at least 15px.
    - No clipped or overlapping interactive elements.
    - Write `report.json` next to the images, listing each failure with selector, screen and width. **[Agent: testing]**
  - [x] Capture the phase-1 "before" set (phone in Light and Dark; desktop in Light and Dark) and the baseline `report.json`. **[Agent: testing]**
  - [x] Verify:
    - Start the app (record the PID) and run the script end to end. Confirm the PNGs exist for every screen and both modes, and that `report.json` lists today's known failures, such as 14px inputs and 10–11px labels.
    - Confirm `git status` shows no files under `review/`.
    - Stop the dev server by PID. Delete any extra screenshots and traces created outside `review/before/`. **[Agent: testing]**

- [x] **Slice 2: Simple primitives run on Base UI with today's look**
  - [x] Add `@base-ui/react` (exact pin) and add a no-op `Element.prototype.getAnimations` polyfill to `test/setup/unit.ts`.
    - Spike first: re-implement `button` on Base UI and run the whole `src/shared/ui/*.test.tsx` suite.
    - If the harness breaks, fix it here before continuing. **[Agent: react-frontend]**
  - [x] Re-implement `button`, `label` (plain `<label>`), `separator`, `avatar`, `checkbox`, `switch`, `collapsible`, `tabs` and `segmented-control` on Base UI parts.
    - Keep today's class strings and today's public API. Add thin compat wrappers where needed: `asChild` maps to `render`; `forceMount` maps to `keepMounted`.
    - Translate `data-[state=…]` selectors to `data-checked` / `data-unchecked` / `data-active`, including `related-games-tabs.tsx`. **[Agent: react-frontend]**
  - [x] Update tests in these primitives that asserted `data-state=` so they assert `aria-checked`, `aria-selected` or `aria-expanded`. Add a behaviour test showing that `tabs` keeps an inactive panel mounted where `forceMount` was used. **[Agent: testing]**
  - [x] Verify:
    - Run the gate.
    - Start the app (record the PID). In the Playwright MCP, toggle a switch and a checkbox in settings, switch tabs on a game page, and open a collapsible.
    - Capture the same screens with the review script into a temporary folder and compare them visually with `review/phase1/before`. There must be no visible change.
    - Stop the server by PID and delete the temporary folder. **[Agent: testing]**

- [x] **Slice 3: Tooltips, popovers and menus run on Base UI with today's look**
  - [x] Re-implement `tooltip` (`delayDuration` becomes `delay`), `popover` (Positioner hidden in the wrapper) and `dropdown-menu` (Base UI `menu`; labels inside `Menu.Group`; the compat wrapper maps `onSelect` to `onClick`, and to `closeOnClick={false}` where a handler calls `preventDefault`). Keep today's classes and API. **[Agent: react-frontend]**
  - [x] Update or add behaviour tests for the status picker popover, the theme-toggle menu (`modal={false}`), the game library controls menu and the Up Next menu actions. Open them with `userEvent`, select an item, and assert the visible outcome. **[Agent: testing]**
  - [x] Verify:
    - Run the gate.
    - Start the app (record the PID). At desktop width, change a game's status through the status picker popover, switch the theme through the menu, and use one library-card menu action.
    - Compare a temporary capture with `review/phase1/before`. There must be no visible change.
    - Stop the server by PID and delete the temporary files. **[Agent: testing]**

- [x] **Slice 4: Dialogs, sheets and the command palette run on Base UI with today's look**
  - [x] Re-implement `dialog`, `sheet` (Base UI dialog), `command` (cmdk inside a Base UI Dialog), `image-lightbox` and `responsive-modal`. Keep today's classes and API. **[Agent: react-frontend]**
  - [x] Add a `shared/lib` helper that keeps a dialog or sheet open when the user presses the toaster. It reads `onOpenChange(open, details)` and cancels on `details.reason === "outside-press"` inside the toaster.
    - Replace the 5 `onInteractOutside` sites with it: `responsive-modal`, `global-action-host`, `command-palette` ×2 and `done-follow-up`. **[Agent: react-frontend]**
  - [x] Write behaviour tests:
    - pressing Undo on a toast while a sheet is open keeps the sheet open;
    - pressing the backdrop closes it;
    - Escape closes it and returns focus to the trigger;
    - the command palette opens with ⌘K and filters results. **[Agent: testing]**
  - [x] Verify:
    - Run the gate.
    - Start the app (record the PID). At phone width, open Add game and Log session from the bottom nav. Open the command palette at desktop width. Open the image lightbox on a game page. Change a status and press Undo while a sheet is open.
    - Compare a temporary capture with the "before" set. There must be no visible change.
    - Stop the server by PID and delete the temporary files. **[Agent: testing]**

- [x] **Slice 5: Selects run on Base UI with today's look**
  - [x] Re-implement `select` on Base UI:
    - pass `items` so the trigger shows the label, not the raw value;
    - `alignItemWithTrigger={false}`;
    - no empty-string values; use `null` for "all".

    Update the 6 consumers to match: platform-select, sort-select, journal-game-filter, imported-games-filter-bar, import-game-modal and the select wrapper itself. Fix the `onValueChange` types for a possibly-`null` value. **[Agent: react-frontend]**
  - [x] Write behaviour tests for library sort and the journal game filter. Choosing an option changes the visible list. The trigger shows the option label. "All" resets the filter. **[Agent: testing]**
  - [x] Verify:
    - Run the gate.
    - Start the app (record the PID). Change library sort and the journal game filter, at phone width and at desktop width, and confirm the list updates and the trigger label is correct.
    - Stop the server by PID and delete the temporary files. **[Agent: testing]**

- [x] **Slice 6: Call sites use Base UI directly; Radix is gone (Release 1)**
  - [x] Migrate the call sites with a ts-morph codemod:
    - `<Button asChild><Link …/></Button>` becomes `<Link className={buttonVariants(...)}>`;
    - triggers with `asChild` use `render={<… />}`, adding `nativeButton={false}` when the element is a link;
    - menu `onSelect` becomes `onClick`.

    Delete the compat wrappers. Remove all 13 `@radix-ui/*` packages; `rg "@radix-ui"` must return nothing. **[Agent: react-frontend]**
  - [x] Add an ESLint `no-restricted-syntax` rule banning the `asChild` JSX attribute, with a test in `test/eslint/` proving it fires. **[Agent: react-frontend]**
  - [x] Fix the regression the first Slice 6 verify found: the "All" / "All platforms" select triggers render muted. Base UI sets `data-placeholder` when the value is `null`, and `select.tsx` styles that as `text-muted-foreground`. An explicit "All" choice must render in foreground text as in `review/phase1/before`; a trigger with no selection and a placeholder stays muted. Cover both with a behaviour test. **[Agent: react-frontend]**
  - [x] Verify:
    - Run the gate and `rg "@radix-ui|asChild" src`, which must be empty.
    - Start the app (record the PID). Run the full review-script capture into a temporary folder and compare it with `review/phase1/before`. There must be no visible change.
    - Walk the main flows in the Playwright MCP: add a game, change status, Undo, log a session, filter the library, open settings.
    - Stop the server by PID and delete the temporary files.
    - Release 1 can ship after this. **[Agent: testing]**

- [x] **Slice 7: Titles use the title font, `/about` shows "not found", and the token layer is cleaned up**
  - [x] In `src/styles.css`:
    - add `--font-sans`, `--font-mono` and `--font-display` to `@theme`, so `font-display` produces CSS;
    - move the still-used custom utilities from `@layer utilities` to `@utility`, so their variants start working (hover shadows, `sm:` gaps);
    - delete the dead parts: about 114 spacing classes, 13 typography classes, unused keyframes, the duplicate reduced-motion block, the v3-shaped `--container-*`, the self-referencing `@theme` bindings, and the unused `chart-*` and `sidebar-*` tokens.

    Diff the compiled CSS to confirm no live class disappeared. **[Agent: react-frontend]**
  - [x] Delete `src/routes/about.tsx` and regenerate `routeTree.gen.ts`. Add an assertion to `src/routes/-route-tree.test.tsx` that `/about` is absent. **[Agent: tanstack-fullstack]**
  - [x] Verify:
    - Run the gate.
    - Start the app (record the PID). Open `/about` and see the standard not-found screen. Confirm in the Playwright MCP, via computed `font-family`, that the four former no-op places use Space Grotesk: log-session title, journal stats rail, journal entry card. Confirm that hovering a button at desktop changes its shadow.
    - Stop the server by PID and delete the screenshots. **[Agent: testing]**

    Accepted deviation (owner, 2026-11-05): moving the spacing utilities to `@utility` sorts them alphabetically, so where one element carries two custom spacing classes (a `Card` variant `p-2xl` plus a call-site `p-lg`; `tailwind-merge` keeps both) the other one now wins. Journal cards and the settings/account cards render tighter than Release 1. Left until Slice 9.

- [x] **Slice 8: Every primitive has the stock Maia look in today's palette**
  - [x] Change `components.json` to `style: "base-maia"` and `baseColor: "neutral"`.
    - Map today's spec-022 oklch values onto the stock shadcn variable names in `:root` and `.dark`. `--primary` is today's teal, and `--accent` is the stock hover surface.
    - Keep `--success/warning/info`, `--status-want/playing/done` and the bottom-nav variables, each declared raw and as `--color-*` in `@theme inline`. Use one stock `--radius`. Delete the other non-stock tokens.
    - Add a note to `.claude/rules/tanstack/shared.md`: never run `shadcn init` or `apply` against the repo. **[Agent: react-frontend]**
  - [x] Re-pull each primitive with `npx shadcn@latest view <name>`, style `base-maia`, in a scratch copy, never in the repo. Diff it and replace the repo file.
    - Apply the deviation table from tech spec §2.4: button sizes `h-11 md:h-9` / `h-10 md:h-8` / icon `size-11 md:size-9`; inputs, textarea, command input and select trigger at `text-base md:text-sm`; a solid focus ring at ≥3:1; `Toaster` taking `theme` from the theme provider.
    - Record the table in a new `src/shared/ui/README.md` section.
    - Restyle the non-shadcn primitives to stock tokens: empty-state, page-header, rating-input, segmented-control, responsive-modal, undo-toast, image-lightbox.
    - Add a stock `Skeleton` and replace the 11 ad hoc `animate-pulse` uses. **[Agent: react-frontend]**
  - [x] Rewrite the class-asserting tests as behaviour tests: `badge`, `alert`, `library-item-card:221,255`, `platform-badges:63`, `library-status-badge:61-69`, `game-card:98-106`. Drop the retired theme names from `theme-provider.test.tsx`. **[Agent: testing]**
  - [x] Fix what the first Slice 8 verify found:
    - Tabs: stock `tabs.tsx` (and `separator.tsx`) key their layout off `data-horizontal`/`data-vertical`, but Base UI emits `data-orientation`, so the related-games tablist renders as a tall column. Make the orientation styles match what Base UI emits.
    - Sheets: stock `SheetContent` has no body padding, so the Add game and Log time sheets are edge to edge on phone. Restore the side inset.
    - 44px on phone (owner, 2026-11-05: everything at 44px, per §2.6): `Input` `h-11 md:h-9`, Button `sm` `h-11 md:h-8`, and drop the `h-8 w-8` override on the game page "More library actions" icon button. Update the deviation table in `src/shared/ui/README.md` and tech spec §2.4.
    Cover the tabs and sheet fixes with behaviour tests. **[Agent: react-frontend]**
  - [x] Verify:
    - Run the gate.
    - Start the app (record the PID). At desktop width, confirm all of the following:
      - primary buttons on every screen share height and corner radius;
      - "Add game" and "Remove from library" dialogs match in radius, inner spacing and button layout;
      - two-button dialog footers have a visible gap;
      - text-field padding is the same everywhere;
      - a toast in Dark mode uses the dark surface;
      - switching Light and Dark changes only colors.
    - Stop the server by PID and delete the screenshots. **[Agent: testing]**

- [ ] **Slice 9: Every screen is on stock spacing and type, with plain section labels**
  - [x] Write the dev-only codemod `scripts/codemods/tailwind-semantic.ts` (ts-morph).
    - It reads the current values from `styles.css` and maps semantic spacing to numeric Tailwind steps, the type classes to stock sizes, and `shadow-paper-*` to `shadow-xs/sm/md`.
    - It touches only string literals in `className`, `cn()` and `cva()`.
    - Where one element ends up with two conflicting spacing classes (a `Card` variant plus a call-site override; see the Slice 7 accepted deviation), keep one stock value on purpose. Release 1 showed the variant's value (e.g. `p-2xl`, 24px), not the call site's.
    - Run it on `src/shared` and `src/entities`, then run the gate. **[Agent: react-frontend]**
  - [x] Run the codemod on `src/features`, then on `src/widgets` and `src/routes`, running the gate after each layer. Grep for retired names left in template literals and fix them by hand. Fix bare `rounded` and arbitrary radius values per file. **[Agent: react-frontend]**
  - [ ] Add `SectionLabel` (body font, sentence case) to `shared/ui`. Replace `terminal-label`, the local `TerminalLabel` clone and every `// LABEL` string with it. Make `PageHeader` the only page-title style, on every screen in §2.0. Remove `font-serif` from the profile name. Replace the last `text-foreground-body` (`journal-stats-rail.tsx`) with a stock color and delete `--foreground-body` (task 8.1 kept it because that file still reads it). **[Agent: react-frontend]**
  - [ ] Verify:
    - Run the gate.
    - Start the app (record the PID). In the Playwright MCP, assert on every screen that:
      - no text starts with `//`;
      - no section label has a monospace computed font;
      - "This month" is in sentence case;
      - section labels on home, game page, journal and settings share size, weight and color;
      - page titles, including the profile name, use the title font.
    - Stop the server by PID and delete the screenshots. **[Agent: testing]**

- [ ] **Slice 10: The custom styling layer cannot come back**
  - [ ] Delete the remaining semantic spacing, typography and shadow utilities from `styles.css`. Confirm `styles.css` is about 300 lines and `rg` finds none of the retired names in `src/`. **[Agent: react-frontend]**
  - [ ] Add `eslint-plugin-better-tailwindcss` (exact pin) to `eslint.config.mjs`. Rules:
    - `no-unknown-classes` against `src/styles.css`;
    - `no-conflicting-classes`;
    - `no-restricted-classes` banning `text-[Npx]`, hex and arbitrary colors, raw palette colors outside an allow-list, `font-serif`, `terminal-label` and the retired semantic names;
    - `no-restricted-syntax` for inline color styles.

    Add rule tests in `test/eslint/`. **[Agent: react-frontend]**
  - [ ] Tooling and docs:
    - bump `prettier-plugin-tailwindcss` to the v4-aware line with `tailwindStylesheet: "./src/styles.css"`;
    - upgrade `tailwind-merge` to the v3 line, with exact pins;
    - update `.claude/rules/tanstack/shared.md` and `widgets.md`, `src/shared/README.md`, `DIVERGENCES.md` and the spec-022 design README to the new rule: tokens in `styles.css`, stock `shadcn view` output as the source of truth, deviations listed in `shared/ui/README.md`. **[Agent: react-frontend]**
  - [ ] Verify:
    - Run the gate.
    - Add a throwaway file using `px-xl`, `text-[11px]` and `bg-[#2f8a82]`, and confirm lint fails on each. Delete the file.
    - Confirm `cn("text-xs","text-muted-foreground")` keeps both classes, using a small node check that is then deleted. **[Agent: testing]**

- [ ] **Slice 11: Phone screens respect the notch, the home indicator and the keyboard**
  - [ ] Change the viewport meta in `routes/__root.tsx` `head()` to `width=device-width, initial-scale=1, viewport-fit=cover`. No `maximum-scale` or `user-scalable`. Add a unit test for the `head()` viewport string. **[Agent: tanstack-fullstack]**
  - [ ] Add `@utility pt-safe/pb-safe/pl-safe/pr-safe` using `env(safe-area-inset-*)`. Apply them to the mobile top bar, the game-detail action bar, the navigation progress bar and the sheet.
    - `SheetContent`: switch to `max-h-[90dvh]`; the scroll area becomes `flex-1 overflow-y-auto`; add a sticky `SheetFooter` with `pb-safe`.
    - Phone `Toaster`: `mobileOffset` above `--bottom-nav-height`. **[Agent: react-frontend]**
  - [ ] Add a `StickyFooter` primitive: pinned at the bottom with `pb-safe` on phone, inline from `md` up.
    - Use it for the primary button of the sign-in, profile setup, log, journal edit and profile settings forms.
    - Move the bottom-sheet primary buttons into `SheetFooter`: Add game, Log session, filters.
    - Add a `visualViewport` adjustment only if the device check shows a field hidden behind the iOS keyboard. **[Agent: react-frontend]**
  - [ ] Verify:
    - Run the gate.
    - Start the app (record the PID). In the Playwright MCP at 390×844, confirm:
      - the primary button of each listed form and sheet is in the bottom third of the screen and stays there while scrolling;
      - toasts appear above the bottom nav.
    - Emulate an iPhone 15 viewport and confirm the computed `padding-top` of the top bar and the `padding-bottom` of the sheet footer reference the safe-area variables.
    - Stop the server by PID and delete the screenshots.
    - Then ask the owner to do the real-device check on an iPhone and an Android phone: notch and home indicator, the keyboard over text fields, no zoom on focus. Record the result in the slice notes. **[Agent: testing]**

- [ ] **Slice 12: Phone screens use bottom sheets, readable text and thumb-sized targets**
  - [ ] Route Remove from library, `library-modal`, whats-new, the Steam import modal and Steam connect through `ResponsiveModal`, so they open as bottom sheets on phone with a visible close button. The sheet close button must not overlap the header text (Slice 8 verify: on the Log time sheet it covers the end of the description). **[Agent: react-frontend]**
  - [ ] Replace every `text-[10px]` and `text-[11px]`: bottom-nav labels, landing, library card, platform and status badges, profile. The floor is `text-xs`; body text is `text-base md:text-sm`. **[Agent: react-frontend]**
  - [ ] Bring every tappable element to at least 44×44 at phone width. Migrate the remaining native `<button>` elements to `Button`, or give them `min-h-11 min-w-11 md:min-h-0 md:min-w-0`. Extend the hit area of small icon controls. Known from the Slice 8 verify: the toast "Undo" action is sonner's own action button (24px; style it through the `Toaster`'s `toastOptions.classNames.actionButton`, the `Button` inside `UndoToastBody` is not on that path), the Grid/List view toggles are 42 px wide, the game page tabs are 32 px, the status chip and status-picker rows are under 44. **[Agent: react-frontend]**
  - [ ] Make hover-only information reachable by tap. Platform badges open a `Popover` on tap; the Steam imported-card icon buttons replace `title=` with `aria-label` plus a tooltip or popover. **[Agent: react-frontend]**
  - [ ] Write behaviour tests:
    - Remove from library opens as a sheet when `useIsDesktop` is false and as a dialog when it is true;
    - tapping a platform badge shows the platform name. **[Agent: testing]**
  - [ ] Verify:
    - Run the gate.
    - Start the app (record the PID). Run the review script's phone checks at 360, 390 and 430. `report.json` must show no overflow, no target under 44×44, no text under 12px and no body text under 15px on any §2.0 screen.
    - In the Playwright MCP, open each of the five dialogs at 390 and confirm they open as bottom sheets.
    - Stop the server by PID and delete the temporary report and screenshots. **[Agent: testing]**

- [ ] **Slice 13: The landing page follows the theme and only today's palette is used**
  - [ ] Remove the forced `class="dark"` and the decorative blobs and gradients from `routes/index.tsx` and the landing widgets, and move them onto shared components and tokens.
    - Add `THEME_COLORS` to `shared/config/site.ts` (today's `--background` for each mode). Use it for the `theme-color` meta and the manifest colors, replacing the retired `#f6f1e7` / `#120f0c`.
    - Unit-test `THEME_INIT_SCRIPT` in jsdom with a stubbed `matchMedia`, for a stored choice, no choice and an invalid value. **[Agent: tanstack-fullstack]**
  - [ ] Make the platform badges neutral: one palette color, the platform name as text. Delete the 20 hexes and the platform tokens. Replace the remaining raw palette colors: `rating-input` amber, `bg-black/55` overlays, landing emerald and fuchsia. Replace the runtime oklch in `derive-banner-gradient.ts` with tokens. **[Agent: react-frontend]**
  - [ ] Verify:
    - Run the gate.
    - Start the app (record the PID). Signed out, in the Playwright MCP:
      - `emulateMedia({ colorScheme: "light" })` shows Light;
      - `"dark"` shows Dark;
      - with `localStorage.theme = "light"` and a dark device, the page shows Light.
    - Scan the computed colors of every element on the §2.0 screens and confirm each is a palette token, excluding covers, screenshots and avatars. `rg` for hex and raw palette classes must be clean.
    - Stop the server by PID and delete the screenshots. **[Agent: testing]**

- [ ] **Slice 14: Readability and focus meet the baseline in both modes**
  - [ ] Check contrast in Light and Dark for body, label, button, placeholder, muted, toast and over-cover text, and for the focus ring. Adjust token values until text reaches 4.5:1 (3:1 for large text) and the focus ring reaches 3:1, without changing hues. Write the measured ratios into `src/shared/ui/README.md`. **[Agent: react-frontend]**
  - [ ] Verify:
    - Start the app (record the PID).
    - In the Playwright MCP, compute contrast ratios for the listed text types on home, library, game page, journal and settings in both modes. Tab through each screen and confirm the focused element has a visible outline at ≥3:1.
    - Stop the server by PID and delete the screenshots. **[Agent: testing]**

- [ ] **Slice 15: Owner approves phase 1 phone first, then desktop (Release 2)**
  - [ ] Capture `review/phase1/after/phone` in Light and Dark with the review script. Assemble the before/after pairs with `report.json`, and list any content or control present before but missing after, other than the items removed in §2.3–2.4. Present the phone pairs to the owner. **[Agent: testing]**
  - [ ] After the owner approves every phone pair, capture `review/phase1/after/desktop` and present the desktop pairs. Rework any rejected pair in a follow-up task and show it again. **[Agent: testing]**
  - [ ] Verify:
    - Confirm the owner approved every phone pair and every desktop pair. Run the gate one last time.
    - Copy `review/phase1/after` to `review/phase2/before`, since the phase 2 "before" is the shipped phase 1.
    - Release 2 can ship after this. **[Agent: testing]**

- [ ] **Slice 16: Owner picks the accent, the title font and the name from options shown on a phone**
  - [ ] Prepare 2–3 accent options and 2–3 title-font options:
    - accents suit the warm surfaces, lie outside hue 170°–220°, and each has fill and text tones meeting AA in both modes;
    - fonts load with at most 2 weights and `display=swap`.

    Each option is a token or font swap behind a dev-only query switch, `?preview=accent-b&font=c`, that is removed in Slice 17. **[Agent: react-frontend]**
  - [ ] Capture home, library and game page for each option with the review script: phone first, Light and Dark. Capture desktop only for the option the owner favours on the phone. Present them together with the owner's list of name candidates. If every option is rejected, prepare a new set. **[Agent: testing]**
  - [ ] Verify: confirm the owner's choice of accent, font and product name is recorded in the slice notes and in `functional-spec.md`'s Change Log. Delete the option captures that were not chosen. **[Agent: testing]**

- [ ] **Slice 17: The app shows the new accent and title font**
  - [ ] Apply the chosen accent as `--primary` / `--primary-foreground`, add `--accent-text` (with `--color-accent-text`), and set `--ring`.
    - Restrict accent classes with `no-restricted-classes` to the primary button, selected or active items, Playing, focus and links.
    - Swap Space Grotesk for the chosen font in the Google Fonts `<link>` and `--font-display`, with a preload for the main weight.
    - Remove the preview switch.
    - Apply the font to `PageHeader`, `DialogTitle`, the game-page name, the landing h1 and the header product name only. **[Agent: react-frontend]**
  - [ ] Verify:
    - Run the gate.
    - Start the app (record the PID). In the Playwright MCP, scan computed colors on the §2.0 screens and confirm the accent appears only in the allowed places.
    - Confirm that page titles, dialog titles, the game name, the landing headline and the header name use the new font, while card and list game names use Geist.
    - Check accent fill and text contrast in both modes.
    - Stop the server by PID and delete the screenshots. **[Agent: testing]**

- [ ] **Slice 18: Covers look the same everywhere**
  - [ ] Move `entities/game/ui/game-cover/` to `shared/ui/game-cover/` with the API `{ src, name, size, priority }`.
    - Look: `aspect-[2/3]`, one radius, shadow and ring.
    - Placeholder: the game name in `line-clamp-3` with "…".
    - Hover feedback comes from the parent link via `group-hover`; IGDB URLs still come from `shared/lib/igdb-image`.
    - Replace the inline cover treatments on home, Up Next, library, search results, the Add game sheet, profile and game page. **[Agent: react-frontend]**
  - [ ] Write behaviour tests for `GameCover`: an image with the game name as its accessible name; the placeholder when `src` is missing; a long name clamped to three lines. **[Agent: testing]**
  - [ ] Verify:
    - Run the gate.
    - Start the app (record the PID). In the Playwright MCP, measure covers on every listed screen at phone and desktop width and confirm they share aspect ratio, radius, shadow and border, and the same hover change at desktop. Use a seeded game without art to check the placeholder.
    - Stop the server by PID and delete the screenshots. **[Agent: testing]**

- [ ] **Slice 19: One status chip everywhere, including "Let go"**
  - [ ] Add `shared/ui/status-chip.tsx` with `status: "want" | "playing" | "done" | "let-go"`. It is built on the Maia `Badge`, uses the `--status-*` colors, and has one casing; `let-go` uses the Done color.
    - Map the domain status and outcome to it at the entity layer.
    - Replace the Badge status variants, `LibraryStatusBadge`, `RunStatusBadge` inline styles, the action-bar and status-switcher color-mix styles, and the cover-gradient accents on library cards, the game page, home, search results and the profile library. **[Agent: react-frontend]**
  - [ ] Write behaviour tests: each status renders its label; "Let go" shares the Done variant attribute; contrast tokens are applied in both modes, asserted via the variant attribute and not via classes. **[Agent: testing]**
  - [ ] Verify:
    - Run the gate.
    - Start the app (record the PID). Confirm the chips on all five surfaces match in shape, size, wording and casing. Confirm Playing uses the accent and a Let go game reads "Let go" in the Done color. Check chip text contrast in both modes.
    - Stop the server by PID and delete the screenshots. **[Agent: testing]**

- [ ] **Slice 20: Up Next is a shelf of covers on the home screen**
  - [ ] Add `widgets/up-next-shelf/`: a horizontal scroll-snap row in queue order.
    - The first cover is larger, capped at about 60% of the phone width so the next one peeks.
    - Use `overscroll-x-contain` and `min-w-0` on parents, so the page never scrolls sideways.
    - The empty state keeps the outline and position, with a button that opens the command palette.
    - Replace the presentation of the spec-026 Up Next block on home. Its data and actions are unchanged. **[Agent: react-frontend]**
  - [ ] Write behaviour tests: covers render in queue order and the first is marked as next; the empty state's button opens the command palette. **[Agent: testing]**
  - [ ] Verify:
    - Run the gate.
    - Start the app (record the PID). With 5 games queued, at 360, 390 and 430 and at desktop width, confirm:
      - the shelf is the first and largest element above the fold;
      - the first cover is larger;
      - part of the second cover shows;
      - the shelf scrolls sideways while `document.scrollingElement.scrollWidth <= innerWidth`.
    - Empty the queue and confirm the empty state.
    - Stop the server by PID and delete the screenshots. **[Agent: testing]**

- [ ] **Slice 21: The app, link previews and the home-screen icon show the new name and logo**
  - [ ] Complete `shared/config/site.ts` (`PRODUCT_NAME`, `PRODUCT_TAGLINE`, `PRODUCT_DESCRIPTION`, `OG_IMAGE_PATH`) and add a `pageTitle(part?)` helper.
    - Use them in the `__root.tsx` head, landing, `games.search.tsx`, `app-sidebar`, `app-mobile-topbar`, `auth-page-view`, `landing-hero`, `settings-list` and `whats-new/config.ts`.
    - Rename the internal identifiers: the `savepoint:command-palette:open` event, `SavepointThemeProvider` and the `sp:` storage prefix.
    - Build absolute `og:url`, `og:image` and `twitter:image` from `BETTER_AUTH_URL`, through a root loader server function and route context, not from client env.
    - Set per-route `og:url` and titles on the landing page and `/games/$slug`.
    - Replace `public/manifest.json` with a server route `routes/manifest[.]json.ts` built from `site.ts`, with `start_url: "/"`.
    - Add an optional `BETTER_AUTH_EXTRA_ORIGINS` to `env.ts` (Zod, comma-separated) feeding Better Auth `trustedOrigins`. **[Agent: tanstack-fullstack]**
  - [ ] Add `shared/ui/logo.tsx` (`LogoMark`, `LogoWordmark`) as an inline `currentColor` SVG for the chosen name. It replaces the three `<img src="/logo.svg">` uses and the auth page's text wordmark.
    - Export the static assets: `favicon.svg` and `.ico`, `apple-touch-icon`, `icon-192` and `icon-512`, the maskable icons and `og-image.png`.
    - Remove the old `logo.svg` and `og-image.svg`. **[Agent: react-frontend]**
  - [ ] Write unit tests:
    - `head()` output: title helper, absolute og URLs, theme-color pair;
    - the manifest route payload: name, short name, icons, colors;
    - `BETTER_AUTH_EXTRA_ORIGINS` parsing;
    - a scan of `src/` and `public/` asserting the old name "SavePoint" appears nowhere user-visible. **[Agent: testing]**
  - [ ] Verify:
    - Run the gate.
    - Start the app (record the PID).
      - Confirm the sidebar, phone top bar, landing, sign-in, tab title and tab icon show only the new name and logo, and the logo is visible in Light and Dark.
      - `curl` `/manifest.json` and the landing and game-page HTML to confirm the og tags are absolute and carry the new name and image.
    - Stop the server by PID and delete the screenshots. **[Agent: testing]**

- [ ] **Slice 22: Owner approves phase 2, and old links land on the new address (Release 3)**
  - [ ] Capture `review/phase2/after/phone` in Light and Dark and present the pairs to the owner, together with a comparison against the same-named competitor's home, library, profile and game pages for the Up Next shelf (§2.12). After phone approval, capture and present desktop. Rework any rejected pair and show it again. **[Agent: testing]**
  - [ ] Infra:
    - Add `additional_callback_urls` to `infra/envs/prod` (dev already has it) and the new origin to the Cognito callback and logout URLs and to `s3_additional_allowed_origins`.
    - Pin `s3_bucket_name` in tfvars and add `lifecycle { prevent_destroy = true }` to the user pool, bucket and pool domain.
    - Do not change `project_name` or `domain_prefix`.
    - `terraform plan` must show only in-place updates. The owner applies dev, then prod. **[Agent: aws-infra]**
  - [ ] Add a "Spec 027 phase 2 — address change" section to `docs/cutover-rollback.md`. It covers the cutover runbook from tech spec §2.9 with a verification and rollback for each step, the re-sign-in and theme-reset notes, and the rule never to detach the old domain. Correct the claim that sessions survive the change. **[Agent: aws-infra]**
  - [ ] Guide the owner through the Vercel steps in order, one at a time, without changing Vercel state yourself:
    1. add the new domain;
    2. verify TLS;
    3. merge;
    4. set `BETTER_AUTH_URL` (and `BETTER_AUTH_EXTRA_ORIGINS` = the old origin) and redeploy;
    5. enable the old domain's 308 redirect to the new one, preserving path and query. **[Agent: aws-infra]**
  - [ ] Verify, after each owner step:
    - On the new host, check Google sign-in (at most one re-sign-in, library unchanged), Steam connect, an avatar upload, a deep link and sign-out.
    - `curl -I "https://<old>/games/<slug>?action=add-game"` returns 308 with a `Location` header on the new host carrying the same path and query.
    - A link preview in Telegram shows the new name and logo.
    - On first visit the theme follows the device setting, and a choice made there persists.
    - Add to Home Screen shows the new icon and name, which the owner checks on a phone.
    - Delete any captured files except the review set.
    - Release 3 is done after this. After 2–4 weeks, a follow-up removes the old origin from S3 CORS and `BETTER_AUTH_EXTRA_ORIGINS`. **[Agent: testing]**

- [ ] **Slice 23: Feature Testing & Regression**

  > Verifies the whole feature end-to-end against functional-spec.md, run after all implementation slices are complete.
  - [ ] Read functional-spec.md acceptance criteria in full. Generate acceptance-level tests that verify the entire feature as a whole — not individual slices. Cover applicable layers (unit for pure logic, integration for service interactions, e2e for user flows) based on the project's testing stack. Write tests with RED validation (must fail before implementation is confirmed done). Annotate each test with `@spec: 027-design-reset` and `@regression` if suitable for long-term regression. **[Agent: testing]**
  - [ ] Run all generated tests. All must pass. Fix any failures before proceeding. **[Agent: testing]**
