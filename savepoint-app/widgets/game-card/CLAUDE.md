# Widget: game-card

Compound GameCard component for displaying game information across the app. Composed of sub-components: cover, header, content, meta, footer, skeleton, and genre badges.

## Structure

- `ui/` -- all sub-components and types
- `lib/` -- card size variants (cva)
- `index.ts` -- barrel export

## Import Rules

- Can import from `features/` (public API) and `shared/`
- Cannot import from `app/`, `data-access-layer/`, or other widgets
- Migrated from `shared/components/` to follow FSD widget layer conventions
