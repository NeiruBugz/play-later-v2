# widgets layer

Composite UI blocks that assemble features and entities into self-contained page sections.

## Import rules

- May import from: `features`, `entities`, `shared`
- May NOT import from: other `widgets`, `app`, or `routes`

## Conventions

- **Widgets may import features.** A widget composes feature affordances (e.g. `upload-avatar`) and navigation into a layout while staying props-driven (e.g. `isOwnProfile`); route-aware wiring lives in the route, not the widget.
- **Display-name privacy.** Never render an email-shaped `name` — legacy accounts seed `name=email`. Filter any `@`-containing name, prefer the user-chosen `username`, then fall back to a generic label (`"User"` / `"Account"`); the raw user id is never user-visible.
- **Host-owned modal state.** A page-level widget mounts a single modal and passes each card an `onClick` that selects its entry. This avoids N modals in the DOM and keeps entity cards display-only.
- **Server fns imported by widget tests** come from their individual module paths (not the feature barrel) so each module can be mocked in isolation; the barrel would drag the feature's server chain — which reaches `*.server.ts` modules the t3-env client guard refuses to load — into jsdom.

## Slice structure

Each widget is a slice with its own `ui/` segment and `index.ts` public API:

```
widgets/
└── profile-overview/
    ├── ui/
    │   └── profile-overview.tsx
    └── index.ts
```
