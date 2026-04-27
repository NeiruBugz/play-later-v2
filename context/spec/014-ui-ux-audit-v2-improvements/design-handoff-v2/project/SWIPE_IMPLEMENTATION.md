# Mobile Swipe Actions for Library Cards

## Overview

This implementation adds gesture-based swipe actions for mobile users on library cards, addressing the UX audit finding that hover-based actions don't work on touch devices.

## Architecture

### Components

#### 1. `LibraryCardSwipe` (`ui/library-card-swipe.tsx`)

A wrapper component that adds swipe-to-reveal functionality using native touch events.

**Key Features:**
- Touch gesture detection with velocity and threshold-based reveal
- Smooth CSS transitions with spring-like physics
- Auto-close after 3 seconds of inactivity
- Prevents interference with link navigation
- Visual swipe hint (animated chevron icons)

**Implementation Details:**
- `SWIPE_THRESHOLD`: 60px - minimum swipe distance to trigger reveal
- `SWIPE_VELOCITY_THRESHOLD`: 0.3 - velocity-based reveal for quick swipes
- `AUTO_CLOSE_DELAY`: 3000ms - auto-close timer after reveal
- Resistance factor: 0.3 when already revealed (prevents over-swiping)
- Maximum swipe distance: 120px (width of action bar)

**Touch Event Handling:**
1. `handleTouchStart`: Captures initial touch position and clears auto-close timer
2. `handleTouchMove`: Calculates swipe distance with resistance
3. `handleTouchEnd`: Determines reveal/close based on threshold and velocity

**Props:**
```typescript
interface LibraryCardSwipeProps {
  children: ReactNode;          // Card content to wrap
  actionBar: ReactNode;          // Action buttons to reveal
  onSwipeStart?: () => void;     // Callback when swipe reveals actions
  onSwipeEnd?: () => void;       // Callback when actions close
  className?: string;
}
```

#### 2. `LibraryCardMobileActions` (`ui/library-card-mobile-actions.tsx`)

Mobile-optimized vertical action bar with status change buttons.

**Key Features:**
- Vertical layout optimized for swipe gesture reveal
- Full-height buttons (min 44px for touch targets)
- Icon + abbreviated label (e.g., "Want", "Owned", "Playing", "Played")
- Same mutation hook as desktop action bar (`useUpdateLibraryStatus`)
- Gradient background for visual separation

**Visual Design:**
- Background: `bg-gradient-to-l from-black/90 via-black/80 to-transparent`
- Button height: `calc(25% - 0.25rem)` - evenly distributed across 4 statuses
- Min height: 44px for accessibility (iOS touch target guidelines)
- Icon size: 16px (h-4 w-4)
- Text size: 10px for compact display

**Props:**
```typescript
interface LibraryCardMobileActionsProps {
  libraryItemId: number;
  currentStatus: LibraryItemStatus;
}
```

#### 3. `LibraryCard` (modified `ui/library-card.tsx`)

Updated to conditionally use swipe wrapper on mobile devices.

**Changes:**
- Added `useMediaQuery("(max-width: 767px)")` to detect mobile
- Extracted `cardContent` JSX for reusability
- Conditionally wraps with `LibraryCardSwipe` on mobile
- Hides desktop hover action bar on mobile
- Disabled hover scale effect on mobile to prevent conflicts

**Mobile Detection:**
- Breakpoint: 767px (standard mobile max-width)
- Same breakpoint used in other features (`LibraryModal`, `JournalEntryDialog`)

## User Experience

### Mobile Flow

1. **Initial State**: Card displays with subtle animated chevron hint on right edge
2. **Swipe Left**: User swipes left on card
3. **Reveal**: Action bar slides in from right after threshold is reached
4. **Interaction**: User taps desired status button
5. **Auto-Close**: Action bar auto-closes after 3 seconds OR immediately after button tap
6. **Manual Close**: User can swipe right to close action bar

### Accessibility

- **Touch Targets**: Minimum 44px height per iOS guidelines
- **Visual Feedback**: Clear animations and color-coded buttons
- **Prevention Logic**: Prevents accidental link navigation during swipe
- **ARIA Labels**: Proper labels on buttons (`config.ariaLabel`)
- **Keyboard Support**: Not applicable (gesture-based mobile feature)

### Performance

- **CSS Transitions**: Hardware-accelerated transforms (`translateX`)
- **Event Handling**: Minimal DOM manipulation
- **No External Libraries**: Pure React + CSS implementation
- **Touch-Only**: No overhead on desktop devices

## Integration Points

### Mutation Hook

Uses existing `useUpdateLibraryStatus` hook from `features/library/hooks/`:
```typescript
const updateStatus = useUpdateLibraryStatus();
updateStatus.mutate({ libraryItemId, status });
```

**Optimistic Updates:**
- Immediate UI update via TanStack Query
- Rollback on error
- Toast notifications for success/failure

### Status Configuration

Uses shared `LIBRARY_STATUS_CONFIG` from `@/shared/lib/library-status`:
- `wantToPlay`: Blue badge, bookmark icon
- `owned`: Amber badge, box icon
- `playing`: Orange badge, gamepad icon
- `played`: Green badge, check circle icon

### CSS Variables

Uses existing CSS custom properties for consistent theming:
```css
--status-wantToPlay: oklch(0.68 0.14 240);
--status-owned: oklch(0.72 0.18 55);
--status-playing: oklch(0.62 0.16 18);
--status-played: oklch(0.65 0.14 145);
```

## Testing Considerations

### Manual Testing Checklist

- [ ] Swipe left reveals action bar
- [ ] Swipe right closes action bar
- [ ] Quick swipe (high velocity) triggers reveal
- [ ] Slow swipe below threshold doesn't reveal
- [ ] Auto-close after 3 seconds
- [ ] Button tap closes action bar immediately
- [ ] Status change mutation works correctly
- [ ] No interference with link navigation
- [ ] Swipe hint visible on initial load
- [ ] Works across different mobile browsers (Safari, Chrome, Firefox)
- [ ] Works on different screen sizes (320px - 767px)

### Automated Testing

Consider adding:
1. **Unit Tests** for swipe gesture calculations
2. **Component Tests** for mobile action bar rendering
3. **Integration Tests** for mutation flow
4. **E2E Tests** using Playwright touch events

Example test structure:
```typescript
describe("LibraryCardSwipe", () => {
  it("reveals action bar on left swipe beyond threshold", () => {
    // Simulate touch events
    // Assert transform value
  });

  it("auto-closes after 3 seconds", () => {
    // Simulate swipe reveal
    // Wait 3 seconds
    // Assert closed state
  });
});
```

## Future Enhancements

### Potential Improvements

1. **Haptic Feedback**: Add `navigator.vibrate()` on reveal (where supported)
2. **Swipe Animations**: Add spring physics library (e.g., `react-spring`)
3. **Customizable Threshold**: Make swipe threshold configurable per user
4. **Long-Press Alternative**: Add long-press gesture for non-swipe users
5. **Undo Toast**: Add "Undo" action to status change toast
6. **Analytics**: Track swipe vs tap usage on mobile

### Known Limitations

1. **No Gesture Library**: Pure CSS/touch events (no third-party library)
2. **Horizontal Swipes Only**: Doesn't prevent vertical scroll during swipe
3. **Single Direction**: Only left swipe supported (right swipe to close)
4. **No Multi-Touch**: Doesn't handle pinch/zoom gestures

## File Structure

```text
features/library/
├── ui/
│   ├── library-card.tsx                    # Modified: conditional swipe wrapper
│   ├── library-card-swipe.tsx              # New: swipe gesture wrapper
│   ├── library-card-mobile-actions.tsx     # New: mobile action bar
│   ├── library-card-action-bar.tsx         # Existing: desktop hover bar
│   └── index.ts                            # Updated: export new components
├── hooks/
│   └── use-update-library-status.ts        # Existing: shared mutation hook
└── SWIPE_IMPLEMENTATION.md                 # This file
```

## Dependencies

- `react`: Touch event handling, hooks
- `@/shared/hooks/use-media-query`: Mobile detection
- `@/shared/components/ui/button`: Button component
- `@/shared/lib/library-status`: Status configuration
- `@/shared/lib/ui/utils`: Tailwind class merging
- `@/features/library/hooks/use-update-library-status`: Mutation hook

## References

- **UX Audit Finding**: Hover-based actions don't work on mobile
- **iOS Human Interface Guidelines**: Touch target size minimum 44px
- **Mobile Breakpoint**: 767px (consistent with other features)
- **CSS Custom Properties**: Status colors from `shared/globals.css`
