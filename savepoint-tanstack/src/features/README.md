# features layer

User-intent slices: each feature owns one user-facing action or scenario.

## Import rules

- May import from: `entities`, `shared`
- May NOT import from: sibling `features`, `widgets`, `app`, or `routes`

## Slice structure

```
features/
└── edit-profile/
    ├── api/        # createServerFn wrappers (server functions)
    ├── model/      # hooks, Zod schemas, derived state
    ├── ui/         # React components
    └── index.ts    # public API — export only what consumers need
```

## Server functions

Feature `api/` segments contain `createServerFn`-wrapped mutations. They validate input with Zod, resolve the session from `entities/session`, call entity-layer query functions, and throw `AppError` subclasses on failure.
