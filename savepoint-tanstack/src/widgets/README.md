# widgets layer

Composite UI blocks that assemble features and entities into self-contained page sections.

## Import rules

- May import from: `features`, `entities`, `shared`
- May NOT import from: other `widgets`, `app`, or `routes`

## Slice structure

Each widget is a slice with its own `ui/` segment and `index.ts` public API:

```
widgets/
└── profile-overview/
    ├── ui/
    │   └── profile-overview.tsx
    └── index.ts
```
