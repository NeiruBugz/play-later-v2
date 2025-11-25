>[toc]
# GameCard Component
Unified, composable card component for displaying games across the application. Supports multiple layouts, densities, and data formats with consistent styling.

## Quick Start
```tsx
import { GameCard } from "@/shared/components/game-card";

// Simple vertical card
<GameCard game={game} />

// Horizontal search result card
<GameCard game={searchResult} layout="horizontal" density="detailed" />

// Library card with minimal density
<GameCard game={libraryItem} layout="vertical" density="minimal" />
```

## Features
- **Multiple Layouts**: Horizontal (search results), Vertical (library), Vertical-Compact (related games)
- **Flexible Density**: Minimal (cover only), Standard (cover + title), Detailed (all metadata)
- **Type-Safe**: Supports multiple data formats with TypeScript type guards
- **Composable**: Sub-components for advanced customization
- **Accessible**: Proper ARIA labels and keyboard navigation
- **Performant**: Next.js Image optimization with responsive sizes
- **Design System**: CVA variants following established patterns

## Component Structure
```
GameCard (main wrapper)
├── GameCardCover (image + overlays + badges)
└── GameCardContent (text content area)
    ├── GameCardHeader (title + badge)
    ├── GameCardMeta (release year + platforms)
    └── GameCardFooter (custom content)
```

## Props
### GameCard
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `game` | `GameData` | **required** | Game data (BaseGameData, SearchGameData, or LibraryGameData) |
| `layout` | `"horizontal" \| "vertical" \| "vertical-compact"` | `"vertical"` | Card layout orientation |
| `density` | `"minimal" \| "standard" \| "detailed"` | `"standard"` | Information density level |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Overall card size |
| `asLink` | `boolean` | `true` | Wrap in Next.js Link for navigation |
| `onClick` | `() => void` | - | Click handler (only used when `asLink={false}`) |
| `enableHoverEffects` | `boolean` | `true` | Enable hover animations and effects |
| `priority` | `boolean` | `false` | Priority loading for cover image |
| `sizes` | `string` | Auto | Responsive sizes for Next.js Image |
| `children` | `ReactNode` | - | Custom content rendered in footer |

### GameData Types
#### BaseGameData (minimal)
```tsx
interface BaseGameData {
  id: number | string;
  name: string;
  slug: string;
  coverImageId?: string | null;
}
```

#### SearchGameData (IGDB search results)
```tsx
interface SearchGameData extends BaseGameData {
  releaseYear?: number | null;
  releaseDate?: number | null;
  platforms?: string[] | Array<{ name: string }>;
  gameType?: number;
}
```

#### LibraryGameData (library items)
```tsx
interface LibraryGameData extends BaseGameData {
  status?: string;
  platform?: string | null;
  entryCount?: number;
  libraryItemId?: number;
  hasMultipleEntries?: boolean;
}
```

## Usage Examples
### Search Results (Horizontal, Detailed)
```tsx
import { GameCard } from "@/shared/components/game-card";
import { GameCategoryBadge } from "@/features/game-search/ui/game-category-badge";

<GameCard
  game={{
    id: 1234,
    name: "The Legend of Zelda: Breath of the Wild",
    slug: "the-legend-of-zelda-breath-of-the-wild",
    coverImageId: "co1234",
    releaseYear: 2017,
    platforms: ["Nintendo Switch", "Wii U"],
    gameType: 0,
  }}
  layout="horizontal"
  density="detailed"
  size="md"
>
  <GameCategoryBadge category={game.gameType} />
</GameCard>
```

### Library Grid (Vertical, Minimal)
```tsx
import { GameCard } from "@/shared/components/game-card";

<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
  {libraryItems.map((item) => (
    <GameCard
      key={item.id}
      game={{
        id: item.game.id,
        name: item.game.title,
        slug: item.game.slug,
        coverImageId: item.game.coverImage,
      }}
      layout="vertical"
      density="minimal"
    />
  ))}
</div>
```

### Related Games (Vertical-Compact)
```tsx
import { GameCard } from "@/shared/components/game-card";

<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
  {relatedGames.map((game) => (
    <GameCard
      key={game.id}
      game={game}
      layout="vertical-compact"
      density="minimal"
      size="sm"
    />
  ))}
</div>
```

### Custom Composition (Advanced)
For maximum flexibility, compose with sub-components:

```tsx
import {
  GameCard,
  GameCardCover,
  GameCardContent,
  GameCardHeader,
  GameCardFooter,
} from "@/shared/components/game-card";
import { Badge } from "@/shared/components/ui/badge";

<Link href={`/games/${game.slug}`}>
  <Card variant="interactive">
    <GameCardCover
      imageId={game.coverImageId}
      gameTitle={game.name}
      badges={
        <>
          <Badge className="absolute top-2 left-2">Playing</Badge>
          <Badge className="absolute top-2 right-2">3 entries</Badge>
        </>
      }
      overlay={
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-end p-3">
          <p className="text-white font-semibold">{game.name}</p>
        </div>
      }
    />
    <GameCardContent>
      <GameCardHeader title={game.name} />
      <GameCardFooter>
        <Button size="sm">Add to Library</Button>
      </GameCardFooter>
    </GameCardContent>
  </Card>
</Link>
```

### Loading States
```tsx
import { GameCardSkeleton } from "@/shared/components/game-card";

// Match layout and density of actual cards
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {Array.from({ length: 8 }).map((_, i) => (
    <GameCardSkeleton
      key={i}
      layout="vertical"
      density="minimal"
    />
  ))}
</div>

// Horizontal skeleton for search results
<div className="space-y-3">
  {Array.from({ length: 5 }).map((_, i) => (
    <GameCardSkeleton
      key={i}
      layout="horizontal"
      density="detailed"
    />
  ))}
</div>
```

## Layout Variants
### Horizontal
---
Best for: Search results, detailed lists
- Cover on left (96px-120px width)
- Content on right with full metadata
- Release year, platforms, category badge
- Good for scanning and comparison

### Vertical
---
Best for: Library grids, game browsing
- Portrait cover (3:4 aspect ratio)
- Title below or on hover overlay
- Status badges, entry count
- Optimal for visual browsing

### Vertical-Compact
---
Best for: Related games, recommendations
- Minimal metadata (cover + title)
- Smaller overall size
- Dense grid layouts

## Density Variants
### Minimal
---
- Cover image only (or + title on hover)
- Best for: Library grids, quick visual scanning

### Standard
---
- Cover + title + basic info
- Best for: Most use cases, balanced information

### Detailed
---
- Cover + title + release year + platforms + badges
- Best for: Search results, detailed browsing

## CVA Variants Reference
```tsx
// Layout
layout: "horizontal" | "vertical" | "vertical-compact"

// Density
density: "minimal" | "standard" | "detailed"

// Size
size: "sm" | "md" | "lg"

// Interactive
interactive: true | false  // Auto-applied based on asLink/onClick
```

## Accessibility
- **Semantic HTML**: Uses proper heading levels and landmarks
- **ARIA Labels**: Descriptive labels for screen readers
- **Keyboard Navigation**: Full keyboard support via Link wrapper
- **Focus Indicators**: Visible focus rings following design system
- **Alt Text**: Descriptive alt text for cover images

## Performance
- **Next.js Image**: Automatic optimization and lazy loading
- **Responsive Sizes**: Appropriate sizes attribute for each layout
- **Priority Loading**: Support for above-the-fold images
- **Blur Placeholders**: LQIP for smooth loading experience

## Migration Guide
### From features/game-search/ui/game-card.tsx
```tsx
// Before
<GameCard game={game} />

// After
<GameCard
  game={{
    ...game,
    coverImageId: game.cover?.image_id,
  }}
  layout="horizontal"
  density="detailed"
>
  <GameCategoryBadge category={game.game_type} />
</GameCard>
```

### From features/library/ui/library-card.tsx
```tsx
// Before
<LibraryCard item={item} />

// After - Use custom composition for complex library features
// (Keep LibraryCard as specialized wrapper for now)
```

### From related-games GameCard
```tsx
// Before
<GameCard game={game} />

// After
<GameCard
  game={{
    ...game,
    coverImageId: game.cover?.image_id,
  }}
  layout="vertical-compact"
  density="minimal"
/>
```

## Design Tokens Used
- Typography: `heading-sm`, `body-md`, `body-sm`
- Colors: `muted`, `muted-foreground`, `primary`
- Spacing: `gap-2`, `gap-3`, `gap-4`, `p-2`, `p-3`, `p-4`
- Border Radius: `rounded-md`, `rounded-lg`
- Shadows: `shadow-paper` (via Card component)
- Animations: `duration-normal`, `transition-all`

## Testing
```tsx
import { render, screen } from "@testing-library/react";
import { GameCard } from "@/shared/components/game-card";

test("renders game card with title", () => {
  render(
    <GameCard
      game={{
        id: 1,
        name: "Test Game",
        slug: "test-game",
      }}
    />
  );
  expect(screen.getByText("Test Game")).toBeInTheDocument();
});

test("renders as link by default", () => {
  render(
    <GameCard
      game={{
        id: 1,
        name: "Test Game",
        slug: "test-game",
      }}
    />
  );
  expect(screen.getByRole("link")).toHaveAttribute("href", "/games/test-game");
});
```

## Related Components
- `GameCoverImage` - Underlying image component
- `PlatformBadges` - Platform display
- `Card` - Base card component
- `Skeleton` - Loading states

---
*Last updated: January 2025*
