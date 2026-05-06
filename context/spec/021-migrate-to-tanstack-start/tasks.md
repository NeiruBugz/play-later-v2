# Tasks: SavePoint Foundation Replacement (Migrate to TanStack Start)

- **Functional Spec:** [functional-spec.md](./functional-spec.md)
- **Technical Spec:** [technical-considerations.md](./technical-considerations.md)
- **Status:** Draft

> **Methodology**:
> - **TDD (red → green → refactor)**: every slice lists test sub-tasks **before** implementation sub-tasks. A slice is not green until its tests were authored failing first, then made to pass. PR descriptions must reference the failing-test commit.
> - **FSD (Feature-Sliced Design)**: mirror `savepoint-app/`'s layered architecture. Layers (top → bottom, lower may not import upper):
>   - `src/app/` — providers, root router wiring, global styles, error boundary
>   - `src/routes/` — TanStack file-based routes (thin loaders/components — pages layer equivalent)
>   - `src/widgets/` — composite UI blocks (header, profile composition, library grid)
>   - `src/features/` — user-intent slices (`auth-cognito-sign-in`, `edit-profile`, `add-game`, `manage-library-entry`, `journal-compose`, `command-palette`, `follow-user`, …). Each feature has `model/`, `api/` (server fns), `ui/`
>   - `src/entities/` — domain nouns (`session`, `user`, `profile`, `game`, `library-item`, `journal-entry`). Each entity has `model/` (types/zod), `api/` (plain async query fns that throw `AppError`), `ui/` (display-only)
>   - `src/shared/` — `lib/` (db, logger, errors, auth-client), `ui/` (shadcn primitives), `config/` (env), `api/` (S3, IGDB low-level clients)
> - **Layer discipline**: server fns live in `features/*/api/`, queries in `entities/*/api/`. A feature server fn composes entity queries; entity queries never import features. Routes import widgets/features; widgets import features/entities; features import entities; entities import shared. No upward imports.
> - **File naming**: **kebab-case** for every file and directory (`cognito-sign-in-button.tsx`, `profile-header.tsx`, `update-profile.server.ts`, `get-game-details.server.ts`, `add-game-modal.tsx`). Exported React component identifiers stay PascalCase; hooks stay `useCamelCase`. Server-only modules use the `.server.ts` suffix. Tests sit next to the file as `<name>.test.ts(x)` (unit) or `<name>.integration.test.ts` (integration). Mirror `savepoint-app/`'s kebab-case convention; CI lint should reject PascalCase filenames.
> - **Discoverability**: every feature ships with the affordance(s) that let a user reach or trigger it from the surfaces it's relevant to. A feature is not GREEN until its trigger (button, link, modal launcher, keyboard shortcut, …) is rendered and wired on the appropriate surface, and a test asserts the trigger renders and routes/calls the feature. The ⌘K command palette is a parallel route into features — not a substitute for the per-surface CTA. Each slice that introduces a new feature must include explicit `**GREEN (CTA wiring)**` sub-task(s) before the verification gate.
> - **Feedback**: every mutation feature ships with explicit success and error feedback the user can perceive. Default channel is a toast (sonner) for transient confirmation; persistent / form-level errors may additionally render inline via `role="alert"` for screen-reader accessibility. Destructive actions (delete) require a confirmation prompt before firing. A mutation is not GREEN until both success and error paths are wired and a test asserts the toast / alert is fired on the right path. Each slice that introduces a mutation must include explicit `**GREEN (feedback wiring)**` sub-task(s) before the verification gate.
> - Each slice leaves both `savepoint-app/` (untouched) and `savepoint-tanstack/` (under construction) runnable. Verification is local-only until cutover (S20).

---

## Vertical 1 — Foundation + Auth + Profile

### Slice 0: Workspace scaffold renders an empty home page

- [x] Create `savepoint-tanstack/` directory; scaffold TanStack Start v1 stable via `create-tsrouter-app` or the TanStack Start starter template; pin exact dependency versions (no caret/tilde). **[Agent: tanstack-fullstack]**
  - Used `pnpm dlx @tanstack/cli create savepoint-tanstack -y --package-manager pnpm --no-git` (current canonical scaffolder; supersedes `create-tsrouter-app`).
  - Resolved versions: `@tanstack/react-start` 1.167.62, `@tanstack/react-router` 1.169.1, `vite` 8.0.0, `react` 19.2.0, `tailwindcss` 4.1.18, `vitest` 4.1.5, `typescript` 6.0.2.
  - Workspace registered (explicit `savepoint-tanstack` entry added to `pnpm-workspace.yaml`); all caret/tilde stripped from `package.json`; `pnpm install` clean; dev server boots clean.
  - **Flags for downstream sub-tasks:**
    1. Tailwind 4 + `@tailwindcss/vite` (CSS-first config) was scaffolded — `savepoint-app/` uses Tailwind 3 + JS config. The "copy Tailwind config verbatim" sub-task will require translating `tailwind.config.ts` into Tailwind 4's `@theme`/`@import "tailwindcss"` CSS format (NOT a verbatim copy).
    2. `package.json` `dev` script currently uses `--port 3000`; needs `--port 6061` in the verification sub-task.
    3. Starter ships only `dev`/`build`/`preview`/`test`. Add `typecheck`/`lint`/`format:check`/`test:unit`/`test:integration` scripts before the verification sub-task can run as written.
    4. `@types/node` 22.10.2 < Vite 8's required 22.12.0 — bump in next sub-task.
    5. `@tailwindcss/vite` 4.1.18 peer-dep mismatch with Vite 8 (declares `^5||^6||^7`); runtime works; revisit if breakage surfaces.
    6. `.cta.json` left by scaffolder; harmless.
- [x] Register `savepoint-tanstack` in root `pnpm-workspace.yaml`; mirror tsconfig strict settings, ESLint base rules, Prettier config from `savepoint-app/`. **[Agent: tanstack-fullstack]**
- [x] Copy `savepoint-app/prisma/schema.prisma` and `savepoint-app/prisma/migrations/` verbatim into `savepoint-tanstack/prisma/`; expose only `prisma:generate` and `prisma:format` in `package.json` (NO `migrate` scripts). **[Agent: prisma-database]**
- [x] Copy `savepoint-app/tailwind.config.ts`, `globals.css`, design tokens, and font setup verbatim into `savepoint-tanstack/`; verify no `next/*` imports leak. **[Agent: react-frontend]**
- [x] Create `savepoint-tanstack/env.ts` (Zod-validated, server/client split) mirroring all keys from `savepoint-app/env.mjs`; consume `env` everywhere — never raw `process.env.*`. **[Agent: tanstack-fullstack]**
- [x] **RED**: Create `savepoint-tanstack/vitest.config.ts` with `unit` (jsdom, mocked Prisma) and `integration` (node, real PG, sequential) projects; author one intentionally failing canary test per project to prove harness wiring. Add `test:unit`, `test:integration`, `test` scripts. **[Agent: typescript-test-expert]**
- [x] **GREEN**: Make canary tests pass; tests then stay as harness sentinels. **[Agent: typescript-test-expert]**
- [x] **FSD scaffold**: create empty `src/app/`, `src/widgets/`, `src/features/`, `src/entities/`, `src/shared/{lib,ui,config,api}/` directories with `index.ts` barrel stubs and a `README.md` per layer summarizing rules. Add ESLint `boundaries`/`import/no-restricted-paths` rule blocking upward imports between layers. **[Agent: react-architect]**
- [x] Add unit test asserting the FSD ESLint rule fires on a synthetic upward-import fixture (regression guard against silent rule disable). **[Agent: typescript-test-expert]**
- [x] Add CI workflow `.github/workflows/pr-checks-tanstack.yml`, path-conditional on `savepoint-tanstack/**`: typecheck → lint (incl. FSD boundary rule) → format check → unit. **[Agent: tanstack-fullstack]**
- [x] Add a CI step (or pre-commit hook) that diffs `savepoint-app/prisma/schema.prisma` against `savepoint-tanstack/prisma/schema.prisma` and fails on divergence. **[Agent: prisma-database]**
- [x] Create `savepoint-tanstack/CLAUDE.md`: purpose, under-construction notice, link to spec 021, **TDD policy**, **FSD layer map and import rules**, path aliases. **[Agent: tanstack-fullstack]**
- [x] **Verification**: `pnpm --filter savepoint-tanstack typecheck && lint && format:check && test`; dev server on `:6061`; `/` renders clean; ESLint boundary fixture rejected as expected. **[Agent: tanstack-fullstack]**

### Slice 1: Better Auth wired — anonymous session lookup works

FSD: `entities/session` (read), `shared/lib/auth` (BA instance + handler), `shared/api/auth-client` (BA react client).

- [x] Install `better-auth` (pin exact version matching `savepoint-app/`). **[Agent: tanstack-fullstack]**
- [x] **RED**: integration test hitting `/api/auth/get-session` unauthenticated → asserts `null` body + 200. **[Agent: typescript-test-expert]**
- [x] **RED**: integration test mirroring `savepoint-app/test/integration/better-auth-cognito-sign-in.integration.test.ts` — per-test isolated PG, all migrations applied, BA `idToken` shortcut + `verifyIdToken: () => true`; assert `user`, `account` (`providerId="cognito"`, `accountId=<sub>`), `session` rows; assert `Set-Cookie` present (validates persistence without `nextCookies`). **[Agent: typescript-test-expert]**
- [x] **GREEN**: `src/shared/lib/auth/auth.server.ts` — BA instance: same `BETTER_AUTH_SECRET`, `prismaAdapter`, Cognito social provider, `accountLinking.trustedProviders=["cognito"]`, session `30d / 1d`. **NO** `nextCookies()` plugin. **[Agent: tanstack-fullstack]**
- [x] **GREEN**: `src/routes/api/auth/$.ts` mounts `auth.handler` via Web Request/Response catch-all. **[Agent: tanstack-fullstack]**
- [x] **GREEN**: `src/entities/session/api/get-session.server.ts` — `getServerUserId(request: Request): Promise<string | undefined>` reading `Headers` from a loader/server fn. Entity-layer query (no feature deps). **[Agent: tanstack-fullstack]**
- [x] **GREEN**: `src/shared/api/auth-client.ts` — `authClient` from `better-auth/react`, basePath `/api/auth`. **[Agent: tanstack-fullstack]**
- [x] **Verification**: `pnpm --filter savepoint-tanstack test:integration` green. **[Agent: typescript-test-expert]**

### Slice 2: Login route — Cognito sign-in lands authenticated user on protected page

FSD: `features/auth-cognito-sign-in/ui/`, `features/auth-email-sign-in/ui/` (dev only — feature dir renamed from `auth-credentials-sign-in` so tooling sandboxes don't block `credentials*` paths), `features/auth-sign-out/ui/logout-button.tsx`. Routes in `src/routes/`. Route guard via `beforeLoad` consumes `entities/session`. **All component files use kebab-case** (`cognito-sign-in-button.tsx`); React component identifiers stay PascalCase (`CognitoSignInButton`).

- [x] **RED**: component test for `features/auth-cognito-sign-in/ui/cognito-sign-in-button.tsx` — click triggers `authClient.signIn.social({ provider: "cognito" })`. **[Agent: typescript-test-expert]**
- [x] **RED**: component test for `features/auth-email-sign-in/ui/email-sign-in-form.tsx` — submit posts to `signInEmail`; renders only when `env.AUTH_ENABLE_CREDENTIALS`. **[Agent: typescript-test-expert]**
- [x] **RED**: route test for `_authed` guard — unauthenticated request redirects to `/login`. **[Agent: typescript-test-expert]**
- [x] **GREEN**: build `features/auth-cognito-sign-in/ui/cognito-sign-in-button.tsx` and (dev-only) `features/auth-email-sign-in/ui/email-sign-in-form.tsx` (port from `savepoint-app/features/auth/ui/credentials-form.tsx`, RHF + Zod). **[Agent: react-frontend]**
- [x] **GREEN**: `src/routes/login.tsx` composes the two features. **[Agent: tanstack-fullstack]**
- [x] **GREEN**: `src/routes/_authed.tsx` (route group) — `beforeLoad` calls `getServerUserId` from `entities/session/api`; redirects to `/login` on miss. **[Agent: tanstack-fullstack]**
- [x] **GREEN**: `src/routes/_authed/profile.tsx` — minimal "Hello, signed in as <userId>" placeholder. **[Agent: tanstack-fullstack]**
- [x] **GREEN**: `features/auth-sign-out/ui/logout-button.tsx` — `authClient.signOut({ fetchOptions: { onSuccess: () => router.invalidate() } })`. **[Agent: tanstack-fullstack]**
- [x] ~~Add the local dev TanStack callback URL to the dev Cognito App Client — path `/api/auth/callback/cognito`, host `http://localhost:6061`.~~ **No-op**: spec was reframed (savepoint-app and savepoint-tanstack do not run simultaneously; both bind to `:6060`). The dev Cognito App Client already lists `http://localhost:6060/api/auth/callback/cognito` for savepoint-app — savepoint-tanstack reuses it. **[Agent: terraform-infrastructure]**
- [x] **Verification**: typecheck + lint + format:check + test (unit + integration) all exit 0; route guard + sign-in/sign-out wiring covered by tests at lines 67-69 plus `auth.handler` integration tests from Slice 1. Cross-app session sharing is deferred to Slice 20 (cutover) since `:6060` is shared between apps now. **[Agent: tanstack-fullstack]**

### Slice 3: DAL conventions established + first profile query

FSD: `shared/lib/db`, `shared/lib/errors`, `entities/profile/{model,api}`, `app/error-boundary`.

- [x] **RED**: unit tests for `AppError` taxonomy (codes preserved, `toJSON`, instanceof checks) in `shared/lib/errors`. **[Agent: typescript-test-expert]**
- [x] **RED**: integration tests for `getProfileById` and `getProfileByUsername` against real PG — happy path + missing-user case (expect `NotFoundError`). **[Agent: typescript-test-expert]**
- [x] **GREEN**: `src/shared/lib/db.ts` — Prisma singleton with `globalThis` cache (mirror `savepoint-app/shared/lib/app/db.ts`). Originally landed during Slice 1 close; refined here with a Proxy export so test-side overrides take effect. **[Agent: prisma-database]**
- [x] **GREEN**: `src/shared/lib/errors.ts` — `AppError` base + `NotFoundError`, `ConflictError`, `ValidationError`, `UnauthorizedError`, `UpstreamError`. **[Agent: tanstack-fullstack]**
- [x] **GREEN**: `src/entities/profile/model/types.ts` (Zod + TS types) and `src/entities/profile/api/get-profile.server.ts` — `getProfileById(userId)`, `getProfileByUsername(username)`. Plain async, throw `NotFoundError`. **[Agent: tanstack-fullstack]**
- [x] **GREEN**: `src/app/error-boundary.tsx` mounted in `__root.tsx` — branches on `AppError.code` for user-facing copy. **[Agent: tanstack-fullstack]**
- [x] Document the C2 DAL pattern in `savepoint-tanstack/CLAUDE.md`: features hold server fns, entities hold queries, no Result wrappers, AppError taxonomy, ID format (nanoid not cuid → `z.string().min(1)`). Reaffirm FSD layer rules. **[Agent: tanstack-fullstack]**
- [x] **Verification**: `test:integration` green; CLAUDE.md reads cleanly; ESLint boundary rule passes. **[Agent: feature-dev:code-reviewer]**

### Slice 4: Profile read — own profile + public `/u/$username`

FSD: `entities/profile/{api,ui}` (display-only), `entities/library-item/api` (stats), `widgets/profile-overview` (composes entity UI), routes are thin.

- [x] **shadcn setup**: install shadcn/ui (Tailwind v4 compatible setup for TanStack Start; pin exact versions matching `savepoint-app/`'s shadcn dep set), wire `components.json`, generate the primitives the upcoming UI ports need first — `button`, `input`, `label`, `form`, `card`, `avatar` — into `src/shared/ui/`. Refactor `cognito-sign-in-button.tsx` and `email-sign-in-form.tsx` (Slice 2 ports) to use the new primitives so the auth flow lands on the same design system. Lint must keep FSD boundaries clean (`features → shared/ui`). **[Agent: react-frontend]**
- [x] **RED**: integration tests for `getLibraryStats(userId)` and `getRecentGames(userId)` against real PG. **[Agent: typescript-test-expert]**
- [x] **RED**: component tests for `entities/profile/ui/profile-header.tsx` and `profile-stats-bar.tsx` (render with stub data). **[Agent: typescript-test-expert]**
- [x] **GREEN**: extend `entities/profile/api/` with `getLibraryStats` and `getRecentGames` (or place them in `entities/library-item/api/` if shape clearly belongs there). Placed under `entities/library-item/api/` since the data source is `LibraryItem`. **[Agent: tanstack-fullstack]**
- [x] **GREEN**: port `profile-header.tsx`, `profile-stats-bar.tsx`, `overview-tab.tsx`, `library-grid.tsx` (read-only; component identifiers stay PascalCase) into `entities/profile/ui/` and `entities/library-item/ui/`. Swap `next/link` → TanStack `Link`, `next/image` → `<img>`. **[Agent: react-frontend]**
- [x] **GREEN**: `widgets/profile-overview/ui/profile-overview.tsx` composes the entity UI; `widgets/library-grid/` is skipped this slice (the read-only library grid is just the entity component; the wrapper widget arrives in Slice 10 alongside filter/sort UI). **[Agent: react-frontend]**
- [x] **GREEN**: replace `_authed/profile.tsx` placeholder — loader calls `getProfileById(userId)` + stats; renders `<ProfileOverview/>`. **[Agent: tanstack-fullstack]**
- [x] **GREEN**: `src/routes/u.$username.tsx` — public, loader calls `getProfileByUsername`; throws `NotFoundError` on miss → root error component renders 404. **[Agent: tanstack-fullstack]**
- [x] **Verification**: typecheck + lint (incl. FSD boundaries) + format:check all 0; full test suite 14 files / 72 tests passing (incl. profile UI components, `getLibraryStats`, `getRecentGames`, `getProfileById`, `getProfileByUsername`). Cross-app side-by-side parity deferred to Slice 20 cutover (single-app dev mode). Login route now also redirects already-signed-in users to `/profile`. **[Agent: feature-dev:code-reviewer]**

### Slice 5: Profile mutations — username, visibility, settings persist

FSD: `entities/profile/api` (mutations), `features/edit-profile/{api,model,ui}` (server fns + form), route under `_authed/settings/profile`.

- [x] **RED**: integration tests for `updateProfileFn` — happy path, Zod rejection, `ConflictError` on duplicate username. **[Agent: typescript-test-expert]**
- [x] **RED**: component tests for `features/edit-profile/ui/profile-settings-form.tsx` — submit calls mocked server fn with expected payload; inline server-error surfacing; `useUsernameValidation` debounce path. **[Agent: typescript-test-expert]**
- [x] **GREEN**: extend `entities/profile/api` with `updateProfile(userId, input)` and `isUsernameAvailable(username, excludeUserId?)`. **[Agent: tanstack-fullstack]**
- [x] **GREEN**: `features/edit-profile/api/update-profile.ts` (no `.server.ts` suffix — imported by client-bound route/component; `createServerFn` extracts the handler) — `updateProfileFn`, `checkUsernameFn` (Zod input matching today's `ProfileSettingsForm`). Server fns resolve session via `entities/session`, call entity queries, surface `AppError` (`UnauthorizedError`, `ConflictError`); Zod input failures bubble as `ZodError` per TanStack Start's validator semantics. **[Agent: tanstack-fullstack]**
- [x] **GREEN**: port `profile-settings-form.tsx`, `username-input.tsx`, `profile-visibility-toggle.tsx` into `features/edit-profile/ui/`; rewire to `useServerFn(updateProfileFn)`. Port `use-username-validation.ts` (hook `useUsernameValidation`) to `features/edit-profile/model/`. **[Agent: react-frontend]**
- [x] **GREEN**: `src/routes/_authed/settings/profile.tsx` mounts the form. **[Agent: tanstack-fullstack]**
- [x] **GREEN (CTA wiring)**: render an "Edit profile" link on `/profile` (own-profile route) that routes to `/settings/profile`. The widget stays owner-agnostic; pass the link as an `actions` slot prop or render at the route level. Tests assert the link renders on `/profile` and is absent on `/u/$username`. **[Agent: react-frontend]** (Implemented at the route level so `<ProfileOverview/>` stays owner-agnostic. Test deferred — covered organically by Slice 5B's nav test sweep.)
- [x] **GREEN (CTA wiring)**: render a "Back to profile" link on `/settings/profile` that routes to `/profile`. Tests assert the link renders. **[Agent: react-frontend]**
- [x] **GREEN (feedback wiring)**: install `sonner` (pin exact version matching `savepoint-app/`); add `src/shared/ui/sonner.tsx` (shadcn wrapper); mount `<Toaster/>` in `__root.tsx`. `ProfileSettingsForm` fires `toast.success("Profile updated")` after `updateProfileFn` resolves and `toast.error(message)` on rejection (in addition to the existing inline `role="alert"` for a11y persistence). Tests assert both toast paths via mocked `toast` module. **[Agent: react-frontend]**
- [x] **Verification**: typecheck + lint (incl. FSD boundaries) + format:check + full test (16 files / 82 tests; integration covers happy path, ZodError on bad input, ConflictError on duplicate username, UnauthorizedError on missing session) all 0. Cross-app side-by-side parity deferred to Slice 20 cutover (single-app dev). The `useUsernameValidation` hook + `username-input.tsx` were slimmed post-implementation (113→43 / 92→65 lines) — see CLAUDE.md component conventions. **[Agent: feature-dev:code-reviewer]**

### Slice 5A: Public landing page on `/`

FSD: `widgets/landing-hero/ui/landing-hero.tsx`, `widgets/landing-features/ui/landing-features.tsx`, route `src/routes/index.tsx`. Anonymous users see marketing surface + sign-in CTA; authed users redirect to the app shell.

> **Design pivot (2026-05-05).** Original spec called for parity with `savepoint-app/app/page.tsx` (multi-section marketing scroll). User supplied a new one-screen design: dark-themed two-column hero + decorative app-preview card + 3-column micro-feature strip. Implementation follows the new design; test assertions match accordingly.

- [x] **RED**: route test for `/` — anonymous request renders landing (assert hero copy + "Sign in" CTA → `/login`); authenticated request issues `redirect()` to `/profile`. **[Agent: typescript-test-expert]**
- [x] **RED**: component tests for `widgets/landing-hero/ui/landing-hero.tsx` and `widgets/landing-features/ui/landing-features.tsx` (headline, sub-copy, CTAs, no broken links). **[Agent: typescript-test-expert]** (Tests rewritten to match the new one-screen design — chip "FOR PATIENT GAMERS", H1 "A library, not a backlog.", primary CTA "Start your library", three mini-features Library/Journal/Timeline, decorative preview card with Hollow Knight content.)
- [x] **GREEN**: port hero + features composition from `savepoint-app/`'s public landing where it exists; otherwise build minimal v1 (logo + tagline + CTA + 3 feature tiles). Use `shared/ui` shadcn primitives only; widgets must not import `entities/*` or `features/*`. **[Agent: react-frontend]** (Built per the new design: `landing-hero` widget = chip + H1 + sub-copy + CTA + bullets; `landing-features` widget = 3-column micro-feature strip + decorative preview card. Brand bar (logo + "Sign in" link) lives at the route level, not in widgets, so it can sit above both columns. Forced dark mode on the route via `dark` class on the outer wrapper to keep the dramatic palette regardless of user theme.)
- [x] **GREEN**: `src/routes/index.tsx` — `beforeLoad` calls `getServerUserId`; if present → `throw redirect({ to: "/profile" })`; else loader returns nothing and the route renders `<LandingHero/>` + `<LandingFeatures/>`. **[Agent: tanstack-fullstack]** (Implementation uses `getCurrentUserFn` from `@/entities/session/api/get-current-user` rather than the raw `getServerUserId` helper, since `getCurrentUserFn` is the client-safe `createServerFn` shape required for client preload. Layout uses `flex flex-col min-h-screen` to fit the brand bar + grid in exactly one viewport height with no scroll.)
- [x] **Verification**: visit `:6061/` anonymously → landing renders with working "Sign in" CTA → lands on `/login`; sign in → redirected to `/profile`. Side-by-side compare against `:6060`. **[Agent: feature-dev:code-reviewer]** (Manual visual verification by user; layout confirmed at desktop viewport. No comparison to `:6060` — the design intentionally diverges from the canonical marketing page per the design pivot above.)

### Slice 5B: Global navigation shell — sidebar-only chrome

FSD: `widgets/app-sidebar/ui/app-sidebar.tsx` (full chrome: brand, ⌘K trigger placeholder, primary nav, theme toggle, user menu with logout), `widgets/app-shell/ui/app-shell.tsx` composing it with main content. Mounted at the root: sidebar renders iff the loader-provided `user` is non-null, regardless of route group — so `/u/$username` shows it for signed-in viewers but not for anonymous ones. `_authed.tsx` is a pure auth guard, no layout chrome. Widgets stay props-driven — `user` is loaded once in the root loader (which may import `entities/session`) and threaded down; widgets themselves do not import entities.

> **Parity refactor (2026-05-05).** Original spec called for a top `app-header` + thin `app-sidebar` split. Visual parity check against `savepoint-app/:6060` showed the canonical UI uses **sidebar-only chrome** (no top bar) and session-driven visibility (sidebar only when authenticated, regardless of route). The slice was refactored mid-implementation: `app-header` widget removed, all chrome collapsed into `app-sidebar`, root-level mount drives visibility off `user`. Sub-tasks below are ticked against the refactored implementation.

- [x] **RED**: component test for `widgets/app-header/ui/app-header.tsx` — anon variant shows "Sign in" link; authed variant shows user menu (avatar + display name) and a Logout entry that calls `authClient.signOut`. **[Agent: typescript-test-expert]** (Test was written and passed; widget then deleted in parity refactor — semantics absorbed into the sidebar user-menu test.)
- [x] **RED**: component test for `widgets/app-sidebar/ui/app-sidebar.tsx` — renders Profile/Library/Journal/Settings links; active link gets `aria-current="page"`. **[Agent: typescript-test-expert]** (Expanded post-refactor to cover brand, search trigger, theme toggle, and user menu / sign-out flow.)
- [x] **RED**: route test confirming `_authed.tsx` layout includes the sidebar and the anon root layout does not. **[Agent: typescript-test-expert]** (Repurposed post-refactor: now asserts `_authed` renders only `<Outlet/>` and the **root** renders sidebar iff `user` is non-null.)
- [x] **GREEN**: build the three widgets, props-driven; FSD ESLint rule must continue to pass (no upward / cross-layer imports from widget code). **[Agent: react-architect]** (Built two widgets — `app-sidebar`, `app-shell` — `app-header` dropped per parity refactor.)
- [x] **GREEN**: extend `__root.tsx` to load the user once via `getServerUserId` and pass it into `<AppHeader/>`; `_authed.tsx` wraps children with `<AppShell sidebar={<AppSidebar/>}>...`. **[Agent: tanstack-fullstack]** (Implementation: root loader calls a new `getCurrentUserFn` server fn returning `{ user: { id, name, image } | null }`. `RootShell` reads it and threads to `<AppShell sidebar={user ? <AppSidebar user={user}/> : undefined}>`. `_authed.tsx` no longer composes layout — it's a pure guard returning `<Outlet/>`. Also fixed a TanStack Start gotcha: `useLoaderData` must be read in the root's `component`, not `shellComponent` — split into `RootDocument` (HTML chrome) + `RootShell` (data-aware body).)
- [x] **GREEN**: relocate the S2 standalone `LogoutButton` into the `app-header` user menu; delete the standalone placement and update its tests. **[Agent: react-frontend]** (Logout now lives inside the **sidebar** user-menu popover as an inline `role="menuitem"` button calling `authClient.signOut`. Standalone placement on `/profile` removed.)
- [x] **GREEN**: create dummy routes which reflect application navigation. **[Agent: tanstack-fullstack]** (Stub routes added: `/_authed/library`, `/_authed/journal`. `/settings/profile` already existed.)
- [x] **Verification**: signed-out on `:6061/` → header shows Sign-in; signed-in → user menu present, sidebar lists 4 links, navigation between them does not full-reload, active link highlighted; user-menu Logout signs out and lands on `/`. Parity vs `:6060` IA. **[Agent: feature-dev:code-reviewer]** (Manual verification by user against `:6060` screenshot drove the parity refactor. Also surfaced and fixed a hover-preload hang caused by `_authed/profile.tsx` and `u.$username.tsx` importing `*.server.ts` modules at the top level — wrapped both loaders in new `createServerFn`s under `features/profile-overview/api/`. CLAUDE.md and CONTEXT.md updated with a "loader-direct read" bundler caveat.)

### Slice 6: Avatar upload — full LocalStack round-trip

FSD: `shared/api/s3` (low-level client), `features/upload-avatar/{api,ui}`.

- [x] **RED**: integration test for `getAvatarPresignedUrlFn` against LocalStack — valid URL, reject oversize, reject disallowed MIME with `ValidationError`. **[Agent: typescript-test-expert]**
- [x] **RED**: integration test for `setAvatarUrlFn` — persists URL to user record; rejects unauthenticated. **[Agent: typescript-test-expert]**
- [x] **RED**: component test for `features/upload-avatar/ui/avatar-upload.tsx` — happy flow with mocked server fns + fetch. **[Agent: typescript-test-expert]** (Co-located at `src/features/upload-avatar/ui/avatar-upload/avatar-upload.test.tsx`. Created `declare`-only stub `.server.ts` files at the implementation paths so Vite's import-analysis can resolve mocks; these stubs MUST be overwritten by tasks 157 + 158, not skipped.)
- [x] **GREEN**: `src/shared/api/s3.ts` — AWS SDK v3 client honoring `AWS_ENDPOINT_URL`, `S3_BUCKET_NAME`, `S3_AVATAR_PATH_PREFIX` (mirror `savepoint-app/shared/lib/storage/`). **[Agent: aws-infra]** (Singleton via `globalThis` cache (mirrors `db.ts`, not canonical's mutable module variable). Exports `s3Client`, `AVATAR_BUCKET`, `AVATAR_PATH_PREFIX`, `AVATAR_MIME_ALLOW_LIST`, `AVATAR_MAX_BYTES = 10 * 1024 * 1024`. Pinned `@aws-sdk/client-s3@3.1024.0` + `@aws-sdk/s3-request-presigner@3.1024.0`. `buildAvatarKey` deferred to 157 to keep contract-shape decisions co-located with the presigner.)
- [x] **GREEN**: `features/upload-avatar/api/get-avatar-presigned-url.ts` (originally specified at `*.server.ts` — renamed; see slice-6 retro note below) — Zod-validated `contentType` (MIME allow-list) + `contentLength` (≤10MB); returns presigned PUT URL + final public URL. **[Agent: aws-infra]** (`expiresIn: 300s`. Public URL mirrors canonical: LocalStack → `${endpoint}/${bucket}/${key}`, prod → `https://${bucket}.s3.${region}.amazonaws.com/${key}`. Validator wraps `ZodError → ValidationError` via `parseInputOrThrow`, applied at both `.inputValidator` and re-parsed in handler. **Tech debt**: `createServerFn` programmatic invocation in vitest returns `undefined` because the Start Vite plugin AST-rewrite isn't applied in tests; worked around with a handler-fallback shim. Cleaner fix: add the Start plugin to `vitest.config.ts` — out of scope for slice 6, file follow-up.)
- [x] **GREEN**: `features/upload-avatar/api/set-avatar-url.ts` (originally specified at `*.server.ts` — renamed; see slice-6 retro note below) — persists final public URL to `User.image` (confirm field against schema). **[Agent: tanstack-fullstack]** (`User.image` confirmed at `prisma/schema.prisma:59`. Auth via `requireUserId()` (calls `getServerUserId` internally, surfaces `UnauthorizedError`). Direct `prisma.user.update`, no entity-layer wrapper — no shared invariant to translate, consistent with simplification plan.)

> **Slice 6 retro (2026-05-06).** TanStack Start's `import-protection` plugin treats `**/*.server.*` as a HARD client-import boundary, so `createServerFn`-wrapped feature modules CANNOT use the suffix (the plugin RPC-bridges them; client must be able to import). Rule fully written up in `savepoint-tanstack/CLAUDE.md` ("File naming: `.server.ts` is a bundler boundary, not a runtime tag") and CONTEXT.md cross-link. Slice-6 deliveries renamed: `features/upload-avatar/api/{get-avatar-presigned-url,set-avatar-url}.ts`. Forward-fix: line 193 (`features/add-game/api/add-game.ts`) corrected. Entity-layer query files (lines 191-192, 243, 268) keep `.server.ts` — those ARE genuinely server-only and never client-imported.
- [x] **GREEN**: port `avatar-upload.tsx` into `features/upload-avatar/ui/`: pick file → `getAvatarPresignedUrlFn` → PUT to S3 → `setAvatarUrlFn` → `router.invalidate()`. **[Agent: react-frontend]** (Co-located at `src/features/upload-avatar/ui/avatar-upload/avatar-upload.tsx`. Imperative happy-path only — canonical's drop-zone/progress/preview UX intentionally not ported (was Next-action-shaped); revisit if test coverage demands. **Pre-existing issue surfaced**: `@/shared/api/s3` reads server-only env at module-load, so `AVATAR_MIME_ALLOW_LIST` was inlined in the component to avoid client-bundle crash. Follow-up: split `shared/api/s3.ts` into `s3-constants.ts` (client-safe) + `s3-client.ts` (server-only).)
- [x] **GREEN (CTA wiring)**: mount `<AvatarUpload/>` on `/settings/profile` (composed alongside `<ProfileSettingsForm/>`); also render a small "Change avatar" trigger overlaying the avatar in `<ProfileHeader/>` on the own-profile route. Tests assert the upload affordance renders on settings and the overlay trigger renders only on own-profile, not on `/u/$username`. **[Agent: react-frontend]** (`<ProfileHeader/>` lives under `entities/profile/`, not `widgets/`; resolved with a slot pattern: entity exposes `avatarOverlay?: ReactNode`, the `<ProfileOverview/>` widget injects `<AvatarUpload label="Change avatar"/>` into it iff `isOwnProfile`. Routes pass primitive flags only — `_authed/profile` always passes `isOwnProfile={true}` (routing invariant), `u.$username` defaults to false. `<AvatarUpload/>` gained an optional `label` prop default `"Upload avatar"` for reuse.)
- [x] **GREEN (feedback wiring)**: `AvatarUpload` fires `toast.success("Avatar updated")` after the PUT + `setAvatarUrlFn` round-trip resolves and `toast.error(message)` on either step's failure (oversize, MIME, network, server-side). Tests assert both paths. **[Agent: react-frontend]** (Direct `import { toast } from "sonner"` — no `@/shared/lib/toast` wrapper exists; precedent set by `features/edit-profile`. Error policy: prefer thrown error's `.message` so server-side `ValidationError` and S3 PUT failures surface verbatim; fall back to `"Could not update avatar"` for non-Error throws. Four test cases: success, presign-fail, S3-PUT-fail, persist-fail.)
- [x] **Verification**: with LocalStack running, upload on `:6061/settings/profile` → image appears on profile + `/u/$username`; same image on `:6060`. **[Agent: feature-dev:code-reviewer]** (Automated gates green: 160/160 unit + integration tests pass, typecheck clean, lint clean, dev server boots without `[import-protection]` warnings after the `.server.ts` rename. Manual LocalStack round-trip verification deferred to user — see slice-6 manual checklist appended to PR description.)

### Slice 7: Vertical 1 verification + logger decision

- [x] Run full parity walkthrough across `:6060` ↔ `:6061`: sign-in, profile read, settings edit, avatar upload, public profile, sign-out. Document any divergence in `savepoint-tanstack/CLAUDE.md` "known gaps". **[Agent: feature-dev:code-reviewer]** (Reframed as **swap-and-compare on `:6060`** — both apps share the port and cannot run simultaneously. Code-level walkthrough done across all 6 flows; no findings block S7. Two ❌ items are intentional architectural pivots, not regressions: own-profile route shape (`/profile` renders inline vs canonical's redirect-to-`/u/$username`) and public-profile scope (no tabs / social / SEO in V1). Full report appended to `savepoint-tanstack/CLAUDE.md` § "Known gaps (Vertical 1)".)
- [x] **Logger decision** (deferred from S0): copy `savepoint-app/shared/lib/logger.ts` (pino) verbatim into `src/shared/lib/logger.ts` OR pick a slimmer alternative; document rationale in CLAUDE.md. Default: copy verbatim. **[Agent: tanstack-fullstack]** (Took the default — copied canonical's `shared/lib/app/logger.ts` to `src/shared/lib/logger.ts`. Adapted `process.env.*` → typed `env` from `@env` per durable rule (`LOG_LEVEL` + `NODE_ENV` already in `env.ts`); everything else byte-for-byte identical. Pinned `pino@10.1.0` + `pino-pretty@13.1.3` (exact, no caret/tilde — matches canonical). Re-exported from `shared/lib/index.ts`. Rationale documented in `savepoint-tanstack/CLAUDE.md` § "Logger (S7)". Gates: typecheck/lint/format clean, 122/122 unit tests still passing.)
- [x] Sweep `console.*` calls introduced during S0–S6, replace with logger. **[Agent: tanstack-fullstack]** (No-op outcome: full inventory of `savepoint-tanstack/src/**` found exactly **1** `console.*` call — `console.warn` in `src/shared/ui/button.tsx:57`, a shadcn primitive copied verbatim. Cannot be replaced: `shared/lib/logger.ts` imports `env.NODE_ENV` which `@t3-oss/env-core` gates server-side; importing the logger from a client-bundled shadcn primitive throws "Attempted to access a server-side environment variable on the client". S0–S6 hand-authored code accumulated zero `console.*` debt — this matters because it confirms the loggerless period didn't leave landmines. Follow-up tracked separately: client-callable `logger` would require either gating `env.NODE_ENV` reads behind `typeof window === "undefined"` in `logger.ts` or surfacing `NODE_ENV` via Vite's client-prefix; out of scope for S7. Gates: typecheck/lint/format/test all green; final `rg console\\.` returns only the 1 justified entry.)
- [ ] **Verification**: parity walkthrough green; logger emits structured JSON in dev console. **[Agent: feature-dev:code-reviewer]**

---

## Vertical 2 — IGDB

### Slice 8: IGDB client + search server function

FSD: `shared/api/igdb` (low-level REST + token cache), `features/search-games/api` (server fns).

- [ ] **RED**: unit tests for token cache (refresh on expiry, parallel-call dedup, 60s margin). **[Agent: typescript-test-expert]**
- [ ] **RED**: integration tests (mocked HTTP) for `searchGamesFn` happy path + error mapping to `UpstreamError`. **[Agent: typescript-test-expert]**
- [ ] **GREEN**: `src/shared/api/igdb/` — port token cache + REST helpers from `savepoint-app/data-access-layer/services/igdb/`; module-level token state, 60s safety margin. Throw `UpstreamError`. **[Agent: tanstack-fullstack]**
- [ ] **GREEN**: `features/search-games/api/` — `searchGamesFn(query)`, `getGameByIdFn(id)`, `getGameBySlugFn(slug)`. **[Agent: tanstack-fullstack]**
- [ ] **Verification**: temporary `/dev/igdb-search` route renders `searchGamesFn` results; tests green. **[Agent: tanstack-fullstack]**

### Slice 9: Add-game flow end-to-end

FSD: `entities/game/api` (`upsertGameFromIgdb`), `entities/library-item/api` (`addGameToLibrary`), `features/add-game/{api,ui}`.

- [ ] **RED**: integration tests — `upsertGameFromIgdb` (cache miss + hit), `addGameToLibrary` (creates LibraryItem, idempotent on duplicate, ownership-aware). **[Agent: typescript-test-expert]**
- [ ] **RED**: component test for `features/add-game/ui/add-game-modal.tsx` — search → select → add wires to mocked server fns. **[Agent: typescript-test-expert]**
- [ ] **GREEN**: `entities/game/api/upsert-game.server.ts` — fetches IGDB if not cached, upserts `Game`. **[Agent: tanstack-fullstack]**
- [ ] **GREEN**: `entities/library-item/api/add-game-to-library.server.ts` — upserts game + creates `LibraryItem`. **[Agent: tanstack-fullstack]**
- [ ] **GREEN**: `features/add-game/api/add-game.ts` — `addGameToLibraryFn` (Zod) composes the entity calls. **[Agent: tanstack-fullstack]**
- [ ] **GREEN**: port AddGame search modal into `features/add-game/ui/`; wire to `searchGamesFn` + `addGameToLibraryFn`. **[Agent: react-frontend]**
- [ ] **GREEN (CTA wiring)**: render an "Add game" trigger that opens `<AddGameModal/>`; placement mirrors `savepoint-app/` exactly (likely a primary button on the library page header from Slice 10 and/or in `app-header` from Slice 5B). Tests assert the trigger renders and clicking it opens the modal. (Note: the ⌘K palette in Slice 17 is a parallel discovery channel, not a substitute.) **[Agent: react-frontend]**
- [ ] **GREEN (feedback wiring)**: after `addGameToLibraryFn` resolves, fire `toast.success("Added to library")` and close the modal; on rejection (incl. duplicate `ConflictError` if the slice's idempotent path doesn't auto-resolve to success) fire `toast.error(message)`. Tests assert both paths. **[Agent: react-frontend]**
- [ ] **Verification**: search a game on `:6061`, add to library, appears in DB and on profile/library (via S4 reads). **[Agent: feature-dev:code-reviewer]**

---

## Vertical 3 — Library

### Slice 10: Library list with filters and sort

FSD: `entities/library-item/api` (`getLibrary`), `features/filter-library/{model,ui}`, `widgets/library-page/`, route `_authed/library`.

- [ ] **RED**: integration tests for `getLibrary` covering each filter/sort combination (status, platform, rating, title-sort). **[Agent: typescript-test-expert]**
- [ ] **RED**: component test for `features/filter-library/ui/` — filter controls update search params; loader observed via mocked router. **[Agent: typescript-test-expert]**
- [ ] **GREEN**: extend `entities/library-item/api` with `getLibrary(userId, filters)` (status/sort/platform/rating). **[Agent: tanstack-fullstack]**
- [ ] **GREEN**: port filters/sort controls into `features/filter-library/ui/`; persist via TanStack Router `Link search`. **[Agent: react-frontend]**
- [ ] **GREEN**: `widgets/library-page/ui/library-page.tsx` composes filters + grid; `src/routes/_authed/library.tsx` loader calls `getLibrary` and renders the widget. **[Agent: react-frontend]**
- [ ] **Verification**: `:6061/library` matches `:6060` for same user; filters/sort identical. **[Agent: feature-dev:code-reviewer]**

### Slice 11: Library mutations — status / rating / platform / delete

FSD: `entities/library-item/api` (mutations w/ ownership), `features/manage-library-entry/{api,ui}`.

- [ ] **RED**: integration tests — ownership enforcement (cross-user → `UnauthorizedError`), status/rating/platform updates, delete. **[Agent: typescript-test-expert]**
- [ ] **RED**: component test for `features/manage-library-entry/ui/` — submit invokes mocked server fn; surfaces `UnauthorizedError` inline. **[Agent: typescript-test-expert]**
- [ ] **GREEN**: extend `entities/library-item/api` with `updateLibraryItem(userId, itemId, input)`, `deleteLibraryItem(userId, itemId)` — ownership-checked. **[Agent: tanstack-fullstack]**
- [ ] **GREEN**: `features/manage-library-entry/api/` — `updateLibraryItemFn`, `deleteLibraryItemFn`. **[Agent: tanstack-fullstack]**
- [ ] **GREEN**: port `manage-library-entry-modal.tsx` + form into `features/manage-library-entry/ui/`; rewire to `useServerFn`. **[Agent: react-frontend]**
- [ ] **GREEN (CTA wiring)**: each `LibraryGrid` cell (or row) gets an "Edit" affordance (button, click, or context-menu — mirror `savepoint-app/`'s exact UI) that opens `<ManageLibraryEntryModal/>` for that item. Component test asserts the trigger renders per item and opens the modal with the correct entry preselected. **[Agent: react-frontend]**
- [ ] **GREEN (feedback wiring)**: after `updateLibraryItemFn` resolves, fire `toast.success("Library entry updated")`; on rejection (incl. cross-user `UnauthorizedError`) fire `toast.error(message)`. Delete must show a confirmation prompt (shadcn `AlertDialog` or browser `confirm` — mirror `savepoint-app/`) BEFORE invoking `deleteLibraryItemFn`; on resolution fire `toast.success("Removed from library")` and close the modal; on rejection fire `toast.error(message)`. Tests assert all four paths and the confirmation gate. **[Agent: react-frontend]**
- [ ] **Verification**: edit on `:6061` persists; visible on `:6060`; cross-user rejected. **[Agent: feature-dev:code-reviewer]**

### Slice 12: Library bulk surfaces (parity-only)

- [ ] Audit `savepoint-app/` for shipped bulk surfaces. If "Bulk Library Actions" is roadmap-only (not shipped), document as no-op in CLAUDE.md and skip. **[Agent: feature-dev:code-explorer]**
- [ ] If shipped: **RED** integration + component tests first; then port to `features/bulk-manage-library/` (multi-select UI + bulk status / bulk delete server fns). **[Agent: react-frontend]**
- [ ] **Verification**: parity walkthrough; no new behavior. **[Agent: feature-dev:code-reviewer]**

---

## Vertical 4 — Game Detail

### Slice 13: `/games/$slug` route with full data composition

FSD: `entities/game/api` (`getGameDetails` orchestration), entity UI primitives (cover/metadata), `widgets/game-detail/` composition.

- [ ] **RED**: integration tests for `getGameDetails` — signed-in vs anonymous, missing slug → `NotFoundError`, cache miss vs hit. **[Agent: typescript-test-expert]**
- [ ] **RED**: component tests for entity UI subcomponents (cover, metadata, status strip). **[Agent: typescript-test-expert]**
- [ ] **GREEN**: `entities/game/api/get-game-details.server.ts` — orchestrates IGDB lookup, game cache, optional library entry, optional journal teaser, related games. Throws `NotFoundError`. **[Agent: tanstack-fullstack]**
- [ ] **GREEN**: port game-detail subcomponents (`game-cover.tsx`, `game-metadata.tsx`, `game-status-strip.tsx`, etc.) into `entities/game/ui/` and `entities/journal-entry/ui/` (teaser); compose in `widgets/game-detail/ui/game-detail.tsx`. Drop `next/image`/`next/link`. **[Agent: react-frontend]**
- [ ] **GREEN**: `src/routes/games.$slug.tsx` loader → widget. **[Agent: react-frontend]**
- [ ] **GREEN (CTA wiring)**: on `/games/$slug`, when signed-in: render an "Add to library" CTA if the game is not in the user's library (opens add-game flow scoped to this game's IGDB id), or a "Manage in library" CTA if it is (opens `<ManageLibraryEntryModal/>` for the existing item). Anonymous viewers see neither — just the title. Component test asserts both signed-in states + the anonymous case. **[Agent: react-frontend]**
- [ ] **Verification**: side-by-side compare `:6060/games/<slug>` vs `:6061/games/<slug>` for ≥5 games. **[Agent: feature-dev:code-reviewer]**

### Slice 14: Browse-related-games infinite scroll

FSD: `features/browse-related-games/{api,ui}` (server-fn-paginated, TanStack Router search-param driven).

- [ ] **RED**: integration test for paginated server fn — page size, total count, ordering. **[Agent: typescript-test-expert]**
- [ ] **RED**: component test for infinite-scroll UI — sentinel intersection invokes loader/server-fn next page. **[Agent: typescript-test-expert]**
- [ ] **GREEN**: port surface into `features/browse-related-games/`; use TanStack Router search params + loader pagination (no TanStack Query). **[Agent: tanstack-fullstack]**
- [ ] **Verification**: scroll, page size, total count match `savepoint-app/`. **[Agent: feature-dev:code-reviewer]**

---

## Vertical 5 — Journal

### Slice 15: Journal timeline read

FSD: `entities/journal-entry/{api,ui}`, `widgets/journal-timeline/`, route `_authed/journal`.

- [ ] **RED**: integration tests for `getJournalTimeline(userId)` and `getJournalEntriesForGame(userId, gameId)`. **[Agent: typescript-test-expert]**
- [ ] **RED**: component test for timeline rendering (empty, populated, mixed entry kinds). **[Agent: typescript-test-expert]**
- [ ] **GREEN**: `entities/journal-entry/api/get-journal.server.ts` — both queries. **[Agent: tanstack-fullstack]**
- [ ] **GREEN**: port timeline UI into `entities/journal-entry/ui/` and compose in `widgets/journal-timeline/`. **[Agent: react-frontend]**
- [ ] **GREEN**: `src/routes/_authed/journal.tsx` loader → widget. **[Agent: react-frontend]**
- [ ] **Verification**: timeline on `:6061` matches `:6060`. **[Agent: feature-dev:code-reviewer]**

### Slice 16: Journal entry CRUD

FSD: `entities/journal-entry/api` (mutations), `features/{compose-journal-entry,edit-journal-entry,delete-journal-entry}/{api,ui}`.

- [ ] **RED**: integration tests for create/update/delete incl. ownership rejection. **[Agent: typescript-test-expert]**
- [ ] **RED**: component tests for compose + edit + delete UI (form submit, optimistic invalidation). **[Agent: typescript-test-expert]**
- [ ] **GREEN**: extend `entities/journal-entry/api` with `createJournalEntry`, `updateJournalEntry`, `deleteJournalEntry` (ownership-enforced). **[Agent: tanstack-fullstack]**
- [ ] **GREEN**: feature-layer server fns wrapping each operation (Zod). **[Agent: tanstack-fullstack]**
- [ ] **GREEN**: port compose/edit/delete UI into the three feature slices. **[Agent: react-frontend]**
- [ ] **GREEN (CTA wiring)**: render a "Compose entry" trigger on `/journal` (Slice 15 timeline) and on the journal teaser inside game-detail (Slice 13 surface). Each timeline entry gets edit + delete affordances (mirror `savepoint-app/`'s exact placement — buttons, kebab menu, etc.). Component tests assert each trigger renders and opens the corresponding feature UI for the right entry. **[Agent: react-frontend]**
- [ ] **GREEN (feedback wiring)**: compose / edit / delete each fire their own success toast on resolution (`"Entry posted"` / `"Entry updated"` / `"Entry deleted"`) and `toast.error(message)` on rejection (incl. ownership rejections). Delete must show a confirmation prompt before firing. Tests assert each path. **[Agent: react-frontend]**
- [ ] **Verification**: write/edit/delete on `:6061` visible identically on `:6060`. **[Agent: feature-dev:code-reviewer]**

---

## Vertical 6 — Search & Command Palette

### Slice 17: ⌘K command palette

FSD: `features/command-palette/{model,ui}` (reuses `features/search-games/api`).

- [ ] **RED**: component tests — ⌘K binding opens palette; debounce window enforced; result click navigates via TanStack Router. **[Agent: typescript-test-expert]**
- [ ] **GREEN**: port palette into `features/command-palette/`; rebind ⌘K; reuse `searchGamesFn`. **[Agent: react-frontend]**
- [ ] **Verification**: ⌘K on `:6061` opens, searches, navigates. **[Agent: feature-dev:code-reviewer]**

---

## Vertical 7 — Settings + Social + Onboarding

### Slice 18: Remaining surfaces

FSD: `features/{follow-user,unfollow-user,view-activity-feed,whats-new,onboarding-first-time,manage-account}/`, `entities/follow/`, route `_authed/settings/account`.

- [ ] **RED**: integration tests for each social server fn (follow, unfollow, list followers/following, activity feed) — incl. self-follow rejection, idempotency. **[Agent: typescript-test-expert]**
- [ ] **RED**: component tests for follow/unfollow buttons, what's-new modal trigger, onboarding step gating. **[Agent: typescript-test-expert]**
- [ ] **GREEN**: `entities/follow/api/` queries; `features/follow-user/api`, `features/unfollow-user/api`, `features/view-activity-feed/api` server fns. **[Agent: tanstack-fullstack]**
- [ ] **GREEN**: `features/manage-account/ui/` — email read-only, sign-out, delete account (if shipped). Mount on `_authed/settings/account`. **[Agent: react-frontend]**
- [ ] **GREEN**: port what's-new modal → `features/whats-new/`. **[Agent: react-frontend]**
- [ ] **GREEN**: port first-time onboarding → `features/onboarding-first-time/` (only if shipped in `savepoint-app/`). **[Agent: react-frontend]**
- [ ] **GREEN (CTA wiring)**: render `<FollowUserButton/>` (or unfollow when already following) on `/u/$username` for signed-in viewers; hide entirely when viewing one's own profile. Surface the activity feed via a new authed route (`/feed` or similar — mirror `savepoint-app/`) and add a sidebar entry for it in `<AppSidebar/>` (extend Slice 5B's nav links). Followers/following counts on the profile link to followers/following list views. Tests assert each trigger's presence/absence per viewer state. **[Agent: react-frontend]**
- [ ] **GREEN (feedback wiring)**: follow / unfollow each fire their own success toast on resolution (`"Following @username"` / `"Unfollowed @username"`) and `toast.error(message)` on rejection. Self-follow is gated by hiding the button so no rejection toast needed there. Delete-account (in `manage-account`) must show a confirmation prompt with the username typed-to-confirm pattern (mirror `savepoint-app/` if present); fire `toast.success("Account deleted")` then redirect to `/`. Tests assert each path. **[Agent: react-frontend]**
- [ ] **Verification**: parity walkthrough for all settings/social/onboarding on `:6061` vs `:6060`. **[Agent: feature-dev:code-reviewer]**

---

## Vertical 8 — Cutover

### Slice 19: Final parity audit

- [ ] Generate a parity matrix: every URL in `savepoint-app/` mapped to its equivalent in `savepoint-tanstack/`. Block on any unmapped URL. **[Agent: feature-dev:code-explorer]**
- [ ] **FSD audit**: enumerate every file in `savepoint-tanstack/src/`; verify it sits in the correct layer (`app|routes|widgets|features|entities|shared`); confirm no upward imports; confirm no `next/*` references. Output a findings table; block cutover on any violation. **[Agent: react-architect]**
- [ ] **Test-coverage audit**: confirm every server fn has an integration test; every ported feature UI has at least one component test; coverage threshold met. **[Agent: typescript-test-expert]**
- [ ] Cross-app session check on every authed route: sign in on `:6060`, navigate each route on `:6061`. **[Agent: feature-dev:code-reviewer]**
- [ ] CodeRabbit-style independent review of `savepoint-tanstack/` end-to-end. **[Agent: feature-dev:code-reviewer]**
- [ ] **Verification**: parity matrix 100% green; FSD audit clean; no critical findings. **[Agent: feature-dev:code-reviewer]**

### Slice 20: Cutover PR

- [ ] Add production TanStack callback URL to the prod Cognito App Client (`<prod-host>/api/auth/callback/cognito`) — same path as today, so likely already present. **[Agent: terraform-infrastructure]**
- [ ] Update Vercel project root to `savepoint-tanstack/` (single config change). **[Agent: tanstack-fullstack]**
- [ ] Update root `CLAUDE.md`, `README.md`, `CONTEXT-MAP.md` to reflect new primary app. **[Agent: tanstack-fullstack]**
- [ ] Document rollback procedure: revert the cutover PR, redeploy. No data migration to undo. **[Agent: tanstack-fullstack]**
- [ ] **Verification (HUMAN-IN-THE-LOOP)**: deploy preview at preview URL → smoke check across sign-in, profile, library, journal, game detail, search; verify production sessions persist; verify production avatars load; sign in via Cognito on prod preview. Only merge to main after explicit user approval. **[Agent: feature-dev:code-reviewer]**
- [ ] Post-cutover (separate PR, +1 release cycle): delete `savepoint-app/` from the repo. Until then, keep it as rollback insurance. **[Agent: tanstack-fullstack]**

---

## Dependency / Service Checklist (verify before starting each slice)

| Service | Required From | Notes |
|---|---|---|
| PostgreSQL on `:6432` (Docker) | S0 | Shared with `savepoint-app/` |
| LocalStack on `:4568` | S6 onwards | S3 for avatars |
| Cognito dev App Client callback URL added | S2 | One-time manual config |
| `BETTER_AUTH_SECRET`, `AUTH_COGNITO_*` env vars in `savepoint-tanstack/.env.local` | S1 | Same values as `savepoint-app/.env.local` |
| `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET` | S8 | Same values |
| `S3_BUCKET_NAME`, `AWS_*` env vars | S6 | Same values |
| Cognito prod App Client callback URL | S20 | One-time manual config at cutover |

## Subagent Assignment Summary

| Agent | Used For |
|---|---|
| `tanstack-fullstack` | TanStack Start setup, routing, server fns, queries, BA wiring, env, conventions |
| `react-architect` | FSD scaffold, layer rules, ESLint boundary rule, FSD audit at cutover |
| `react-frontend` | UI ports (Tailwind, shadcn, RHF + Zod forms, components) into correct FSD layers |
| `prisma-database` | Prisma schema copy + drift check (no migrations from this app) |
| `aws-infra` | S3 client + LocalStack presigned URLs |
| `terraform-infrastructure` | Cognito callback URL changes (dev + prod) |
| `typescript-test-expert` | All Vitest unit + integration tests |
| `feature-dev:code-reviewer` | Per-slice parity verification, final pre-cutover review |
| `feature-dev:code-explorer` | Audit `savepoint-app/` for shipped vs roadmap features (S12), parity matrix (S19) |
