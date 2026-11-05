# entities layer

Domain nouns: the core business objects of SavePoint.

## Import rules

- May import from: `shared` only
- May NOT import from: sibling `entities`, `features`, `widgets`, `app`, or `routes`

## Slice structure

```
entities/
└── profile/
    ├── api/        # plain async query fns — throw AppError, no Result wrappers
    ├── model/      # Zod schemas, TypeScript types
    ├── ui/         # display-only components (no mutations)
    └── index.ts    # public API
```

## Query conventions

Entity `api/` functions are plain `async` functions that call Prisma directly. They throw `AppError` subclasses on failure (`NotFoundError`, `ConflictError`, etc.). No `createServerFn` here — that belongs in `features/*/api/`.

Binding rules (PRESCRIPTIVE) live at [`.claude/rules/tanstack/entities.md`](../../../.claude/rules/tanstack/entities.md) and auto-load when Claude reads files under `src/entities/`.

## Barrel hygiene (`api/index.ts`)

An entity `api/index.ts` is a client-reachable PUBLIC barrel, so it must expose ONLY client-safe surface. `.server.ts` modules are server-only — bundler import-protection denies them in the client build (FOOT-GUNS.md #2). Their VALUE exports are deep-imported by their server consumers, never re-exported from the barrel. Type-only re-exports are erased at build time and are safe. A barrel with no client-safe values yet is just `export {}`.

## Documented exception: `session`

The `session` entity carries the `getCurrentUserFn` `createServerFn` wrapper without `.server.ts` suffix — a documented architectural carve-out. Session is the _access ticket_, not a domain entity. The root route `beforeLoad` caches it via `currentUserQueryOptions` (5 min) and `_authed` guards read `context.user`; ~~`requireUserIdOrRedirectFn`~~ and ~~`getCurrentUserIdFn`~~ were removed. Call `invalidateCurrentUser(queryClient)` after anything that changes username, name, image, or the notice flag. See [`CONTEXT.md`](../../CONTEXT.md) and [`.claude/rules/tanstack/entities.md`](../../../.claude/rules/tanstack/entities.md) "Documented exceptions" for the rationale.
