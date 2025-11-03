# Test Fixtures

Centralized, reusable fixtures live here to keep tests concise and focused.

## Usage

- Import fixtures via the alias:

```ts
import { searchResponseFixture } from "@fixtures/search";
// or from the barrel if exported there
import { searchResponseFixture } from "@fixtures";
```

## Guidelines

- Keep fixtures small and composable; avoid giant, catch-all objects.
- Prefer typed factory helpers (functions that return objects) when structure varies.
- Use static JSON files when you want stable snapshots (e.g., API payloads).
- Group domain-specific fixtures in subfolders (e.g., `igdb/`, `auth/`, `profile/`).
- Re-export common fixtures from `index.ts` for convenience.

## Structure

```
test/
  fixtures/
    index.ts         # Barrel re-exports for common fixtures
    search.ts        # Example TS fixture
    igdb/
      *.json         # Static payloads
```

