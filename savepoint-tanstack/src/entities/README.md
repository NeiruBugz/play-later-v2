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
