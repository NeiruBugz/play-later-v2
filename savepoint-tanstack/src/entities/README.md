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

## Documented exception: `session`

The `session` entity carries `createServerFn` wrappers (`requireUserIdOrRedirectFn`, `getCurrentUserIdFn`) without `.server.ts` suffix — a documented architectural carve-out. Session is the _access ticket_, not a domain entity, and route guards need a `createServerFn` for `beforeLoad`. See [`CONTEXT.md`](../../CONTEXT.md) and [`.claude/rules/tanstack/entities.md`](../../../.claude/rules/tanstack/entities.md) "Documented exceptions" for the rationale.
