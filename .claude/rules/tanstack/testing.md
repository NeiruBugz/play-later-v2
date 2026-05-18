---
description: Test conventions for savepoint-tanstack (elements/actions/given-when-then, mock patterns, worker-split tests)
paths:
  - "savepoint-tanstack/**/*.test.{ts,tsx}"
  - "savepoint-tanstack/test/**/*.{ts,tsx}"
---
# Rules — Testing (cross-cutting)

Vitest 3-project setup (unit / integration / components). Every test file
follows the same shape — see this rule file and the canonical examples it
points to before writing a new test.

## Test conventions (every `.test.tsx` follows this)

- **Rule:** module-level `const elements = { ... }` map of domain-named query helpers wrapping `screen.getByX` / `screen.queryByX`. Names express *intent* (`getSocialProviderButton`, `getEmailInput`), not RTL mechanics. **Why:** centralizes "how do we find X"; label/role changes are a one-place edit.
- **Rule:** module-level `const actions = { ... }` map of domain-named user interactions, each composing `elements` calls plus a `userEvent` interaction. Names are domain verbs (`submitForm`, `clickSocialProviderButton`). **Why:** action vocabulary; tests read like requirements.
- **Rule:** outer `describe(ComponentName)`, inner `describe("given …")`, `it("...")` is a single Then. **Why:** scenario grouping; multiple `it`s under one `describe` re-run the arrange+act with clean state.
- **Rule:** arrange + trigger in `beforeEach`; `it` bodies are **assertions only**. **Why:** each `it` re-runs the arrange with fresh state — no order coupling.
- **Rule:** implicit-setup `userEvent` — call `await userEvent.click(...)` directly. Skip `const user = userEvent.setup()` unless you need to configure delay / clipboard / skipHover. **Why:** less ceremony.
- **Rule:** strings over regex in queries — `screen.getByRole("button", { name: "Sign in" })`. **Why:** strict equality, no regex parsing tax, label drift fails loudly.

**Reference shapes:** `src/features/auth-cognito-sign-in/ui/cognito-sign-in-button.test.tsx`, `src/features/auth-email-sign-in/ui/email-sign-in-form.test.tsx`.

## Mock patterns

- **Rule:** Link-rendering widgets / features mock `@tanstack/react-router` in their test files; the mock resolves `to + params` to a plain `<a>`. **Why:** avoids needing `RouterProvider` in component tests. Pattern in `landing-hero.test.tsx`.
- **Rule:** server fns are NOT mocked in component tests — use `vi.mock("@/features/X/api/fn", () => ({ fnName: vi.fn() }))` and assert on call args. **Why:** keeps tests deterministic without the Start runtime.
- **Rule:** Prisma is mocked in unit tests via `test/setup/unit-setup.ts`; integration tests use `setupIsolatedDatabase()` for a real isolated Postgres database. **Why:** unit speed vs. integration fidelity.

## Worker-split integration tests

- **Rule:** when a feature has a worker-split (`<fn>.worker.ts` + `<fn>.ts`), integration tests import the **worker**, not the `createServerFn` wrapper. **Why:** foot-gun #8 — the wrapper requires the TanStack Start runtime which vitest doesn't load. Pattern in `test/integration/update-profile.integration.test.ts`.
- **Rule:** integration tests call the worker as `await myWorker(userId, { /* input */ })` and drive the unauth path with `await myWorker(undefined, { /* input */ })`. **Why:** worker owns its own auth gate so the unauthorized branch is testable without `requireUserId()`.

## Coverage expectations

- **Rule:** every component (under `app/`, `widgets/`, `features/*/ui/`, `entities/*/ui/`) has a colocated `.test.tsx`. **Why:** TDD policy is binding per parent CLAUDE.md.
- **Rule:** every entity query has an integration test under `test/integration/`. **Why:** entity queries are the system's correctness backbone.
- **Rule:** every feature `createServerFn` either has a worker-split with an integration test on the worker, OR is so trivial (1-3 lines, no DB writes) that the entity-layer test covers it. **Why:** the test boundary catches what matters.

## Canary tests

- **Rule:** do not delete the sentinel tests under `test/canary/` or the boundary-rule regression test at `test/eslint/`. **Why:** they prove the harness is wired; deleting them silently invalidates the entire test suite.

## See also

- [`server-fns.md`](./server-fns.md) — worker-split pattern
- [`../../../savepoint-tanstack/CLAUDE.md`](../../../savepoint-tanstack/CLAUDE.md) — Component test conventions (full reference)
