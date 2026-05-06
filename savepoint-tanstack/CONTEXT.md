# savepoint-tanstack — Context & DAL Terminology

> Companion to [CLAUDE.md](./CLAUDE.md). CLAUDE.md is the rule book; this file is the dictionary the rules speak in. When a rule says "loader-direct read" or "UX-hint query," look here for the definition.

## Why this file exists

The FSD layer map and import rules in CLAUDE.md describe **where** code goes. This file describes **what concepts** the layers contain, so future slices don't re-litigate the same architectural questions:

- "Does this need a feature server fn?"
- "Where does the privacy check live?"
- "Is this a UX hint or an enforcement gate?"

Definitions here are stable. Rules in CLAUDE.md may evolve. If a rule changes, update both files in the same commit.

## DAL concepts

### Loader-direct read

---

A TanStack Start route `loader` that composes one or more `entities/*/api/` queries with **no** `features/*/api/` server fn between.

**Required when:** the route's read has no consumer outside the loader itself — no client component invokes it via `useServerFn`, no other server fn composes it, no `beforeLoad` guard reads it. The result is consumed only by the route component that owns the loader.

**Canonical shape:**

```ts
export const Route = createFileRoute("/_authed/profile")({
  loader: async () => {
    const userId = await requireUserId();
    const [profile, stats] = await Promise.all([
      getProfileById(userId),
      getLibraryStats(userId),
    ]);
    return { profile, stats };
  },
  component: ProfilePage,
});
```

**Trade-off accepted:** loaders carry composition logic — even non-trivial `Promise.all` of N reads — when the result is only consumed by that one route. The win is no empty `features/<name>/` shells whose sole job is to wrap entity queries.

**Counter-indication:** if the composition becomes complex enough that _the entity layer_ is the right home (e.g., a privacy gate, a status materialization rule), push the logic into a deeper entity query, not into a feature.

**Known bundler caveat (TanStack Start v1 + Vite `import-protection`).** The canonical shape above breaks at runtime when the route is preloaded on the client (default `preload: "intent"` triggers on hover). Top-level `.server.ts` imports in a route file are not stripped from the client bundle by TanStack Start's route-extractor, so the protection plugin denies them and the preload promise never resolves — the entire app hangs on hover. Imports inside a `createServerFn().handler(...)` body **are** stripped, because the plugin replaces the body with an RPC stub on the client build.

Until the extractor learns to strip loader-only imports (or until we drop hover preload), a route whose loader needs server-only modules must wrap that work in a `createServerFn` exported from a non-`.server.ts` file (mirroring `getProfileSettingsFn`). The route file then imports only the server-fn value, which is client-safe. This server fn is loader-only and would, by the strict rule, not exist; the bundler reality is the only justification for it. Mark such fns with a brief comment referencing this caveat. The rule itself remains correct as the target architecture — only the canonical shape's literal `import { x } from "./x.server"` line is currently the foot-gun.

See [CLAUDE.md → File naming: `.server.ts` is a bundler boundary, not a runtime tag](./CLAUDE.md#file-naming-serverts-is-a-bundler-boundary-not-a-runtime-tag) for the broader rule: `createServerFn`-wrapped modules must NOT use the `.server.ts` suffix; only genuinely server-only modules (DB clients, BA instance, entity queries) do.

### Feature server fn

---

A `createServerFn` exported from `features/<name>/api/`. Required **iff at least one consumer is not a route loader**.

Non-loader consumers:

- Client components calling via `useServerFn` (mutations, refetches, optimistic UI).
- Other server fns that need the unit as a building block.
- Route `beforeLoad` guards (which run before the loader's data context).

If the only consumer is a route loader, the call is a [loader-direct read](#loader-direct-read), not a feature server fn. There is no escape hatch for "the composition is large" — large composition that doesn't have a non-loader consumer is still a loader-direct read.

**Handler shape:**

```ts
export const fooFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => fooSchema.parse(data))
  .handler(async ({ data }): Promise<Foo> => {
    const parsed = fooSchema.parse(data); // re-parse — see below
    const userId = await requireUserId();
    // ...delegate to entity queries with `parsed`...
  });
```

**Why the handler re-parses.** TanStack Start runs `.inputValidator` only on cross-network requests. Programmatic callers — other server fns, tests, and the test harness invoking `fooFn({ data })` directly — bypass the validator entirely. The handler's own `parse` is the only validation those call paths see. The redundancy is structural: each `parse` covers a different call path, and removing either one creates a hole.

Handlers never branch on whether they're under test. They never catch `getRequest()` to provide a stub fallback — that workaround belongs in the test harness, not in production handler code.

### Privacy invariant

---

A rule about _who_ may read an entity, owned by the entity query layer — not by feature handlers, not by route guards.

Canonical example: a `User` row is publicly readable only when `isPublicProfile = true`. The query that powers `/u/$username` lives at `entities/profile/api/get-public-profile.server.ts` and throws `NotFoundError` for **both** "row missing" and "row exists but private." Callers (loaders, server fns, route guards) cannot distinguish the two cases — by design.

**Why entity-owned:** privacy is a property of the data, not of the surface that displays it. Putting the gate in a feature handler means a future surface can forget it. Putting it in the entity query means every reader inherits it.

**Test placement:** privacy invariants are exercised in the entity's integration test (`*.integration.test.ts`), not in the feature/route layer.

### UX-hint query

---

A query whose purpose is **interactive UI feedback, not enforcement**. Lives in `entities/<noun>/api/` like any other read, but is named to signal intent.

Canonical example: `getUsernameAvailability(username)` powers the live hint as the user types in the settings form. It does **not** gate `updateProfile`. Enforcement is the database unique index, surfaced once by the entity update path translating Prisma's `P2002` to `ConflictError`.

**Naming convention:** query-shaped verbs — `getXAvailability`, `checkXHint`, `previewX`. Never appears as a precondition check inside a feature server fn handler — that would re-introduce a TOCTOU race the database constraint already closes.

**Rule:** every database-enforced invariant is surfaced in **exactly one place** — the entity query that catches the Prisma error code. Feature handlers do not pre-check.

### Handler helper vs route-guard server fn

---

Two distinct shapes for "I need the signed-in user ID," with different intents:

| Concept                   | Module                      | Behaviour                                                                              | Used in                                                                |
| ------------------------- | --------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Handler helper**        | `requireUserId()`           | Reads `getRequest()`, calls `auth.api.getSession`, throws `UnauthorizedError` on miss. | Inside `createServerFn` handlers.                                      |
| **Route-guard server fn** | `requireUserIdOrRedirectFn` | Same lookup; throws `redirect({ to: "/login" })` on miss.                              | `beforeLoad` of `_authed.tsx` and other guarded route groups.          |
| **Low-level reader**      | `getServerUserId(request)`  | Returns `string \| undefined`. Never throws.                                           | Tests; rare conditional-read paths where "no user" is a normal branch. |

**Rule:** authed feature handlers and authed loaders call `requireUserId()`. They do **not** call `getServerUserId` directly — doing so re-introduces the four-line null-check ritual the helper exists to remove.

## Domain nouns

> _Filled in slice-by-slice as entities arrive. Each entry names the noun, points at its module, and lists invariants that live with it. Today: Profile, LibraryItem, Session. Future: Game, JournalEntry, Follow._

### Profile

---

The publicly-presentable view of a `User`. Distinct from the Better Auth `User` row in that `Profile` selects only display fields (`id`, `name`, `username`, `image`, `isPublicProfile`) and never auth-internal columns.

Module: [`src/entities/profile/`](./src/entities/profile/).

Invariants owned here:

- **Username uniqueness** — enforced by the database unique index on `usernameNormalized`. Surfaced once: `update-profile.server.ts` maps Prisma `P2002` (target = `usernameNormalized`) to `ConflictError`. The UX-hint counterpart is `getUsernameAvailability`.
- **Public-profile privacy** — `getPublicProfile(username)` throws `NotFoundError` when the row is missing _or_ when `isPublicProfile === false`. See [Privacy invariant](#privacy-invariant).

### LibraryItem

---

A user's relationship to a `Game`: status, rating, platform. `(userId, gameId)` is unique.

Module: [`src/entities/library-item/`](./src/entities/library-item/).

Aggregate currently exposed: `getLibraryStats(userId)` → `{ statusCounts, recentGames, journalCount }`. **Don't add specialized subset queries** whose result is already a field of an existing aggregate (e.g., no `getRecentGames` returning `stats.recentGames`). If the aggregate's shape is wrong, change the aggregate.

### Session

---

A Better Auth session. Module: [`src/entities/session/`](./src/entities/session/).

Three callable shapes — see [Handler helper vs route-guard server fn](#handler-helper-vs-route-guard-server-fn) for which to use where.
