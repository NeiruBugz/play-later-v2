# calculateSmartStatus Usage

The `calculateSmartStatus` helper function determines the appropriate library status for an imported Steam game based on its playtime and last played date.

## Import

```typescript
import { calculateSmartStatus } from "@/features/steam-import";
// or
import { calculateSmartStatus } from "@/features/steam-import/lib/utils";
```

## Usage

```typescript
import type { ImportedGame } from "@prisma/client";
import { calculateSmartStatus } from "@/features/steam-import";

// Example: Determine status for a newly imported game
const importedGame: ImportedGame = {
  id: "game-123",
  name: "The Witcher 3",
  storefront: "STEAM",
  storefrontGameId: "292030",
  playtime: 500, // 500 minutes of playtime
  lastPlayedAt: new Date("2024-01-15"),
  // ... other fields
};

const status = calculateSmartStatus(importedGame);
// Returns: LibraryItemStatus.PLAYING (if within 7 days)
//       or LibraryItemStatus.PLAYED (if > 7 days ago)
```

## Logic

| Condition | Result |
|-----------|--------|
| `playtime` is `0`, `null`, or `undefined` | `OWNED` |
| `playtime > 0` AND `lastPlayedAt` within 7 days | `PLAYING` |
| `playtime > 0` AND `lastPlayedAt` > 7 days ago | `PLAYED` |
| `playtime > 0` AND `lastPlayedAt` is `null` | `PLAYED` |

## Examples

### Never Played (OWNED)
```typescript
const game = {
  playtime: 0,
  lastPlayedAt: null,
};
calculateSmartStatus(game); // LibraryItemStatus.OWNED
```

### Recently Played (PLAYING)
```typescript
const game = {
  playtime: 120,
  lastPlayedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
};
calculateSmartStatus(game); // LibraryItemStatus.PLAYING
```

### Not Recently Played (PLAYED)
```typescript
const game = {
  playtime: 500,
  lastPlayedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
};
calculateSmartStatus(game); // LibraryItemStatus.PLAYED
```

### Played but No Last Played Date (PLAYED)
```typescript
const game = {
  playtime: 250,
  lastPlayedAt: null, // Steam sometimes doesn't track this
};
calculateSmartStatus(game); // LibraryItemStatus.PLAYED
```

## Use Cases

1. **Steam Import Curation**: When adding imported games to the user's library, use this function to set an intelligent default status.

2. **Bulk Import**: When importing multiple games from Steam, apply this function to each game to provide a sensible starting point for library organization.

3. **Status Suggestion**: In the UI, show users the suggested status before they manually curate their imported games.

## Notes

- The 7-day threshold is intentional to balance between "actively playing" and "finished/paused"
- Games with 0 playtime are marked as `OWNED` to indicate the user has the game but hasn't launched it yet
- This is a helper for initial status suggestion; users can always manually change the status later
