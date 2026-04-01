# Widgets Layer

Compositional UI blocks that combine features and shared components into larger page sections. Widgets sit between the `app/` and `features/` layers in the FSD hierarchy.

## Import Rules

Widgets CAN import from:
- `features/` (public API only)
- `shared/`

Widgets CANNOT import from:
- `app/`
- `data-access-layer/`
- Other widgets (keep widgets independent)

## Current Widgets

| Widget | Purpose |
|--------|---------|
| `header/` | App-wide navigation header |
| `game-card/` | Compound game card component with cover, content, header, meta, footer, skeleton, and genre badges |

## Structure Convention

Each widget uses FSD segments: `ui/` for components and types, `lib/` for variants and utilities. Public API is exported via `index.ts` barrel.
