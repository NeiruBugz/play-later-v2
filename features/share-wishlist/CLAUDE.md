# Share Wishlist Feature - CLAUDE.md

This file provides guidance to Claude Code when working with the share-wishlist feature module.

## Feature Overview

The Share Wishlist feature enables users to generate and share public URLs of their game wishlists, facilitating social sharing and wishlist discovery. It provides one-click URL generation with clipboard integration and user-friendly guidance for sharing gaming interests with friends and family.

### Core Functionality

- **URL Generation**: Creates shareable URLs in format `{origin}/wishlist/{username}`
- **Clipboard Integration**: One-click copying of shareable URLs to clipboard
- **User Guidance**: Profile completion prompts when username requirements aren't met
- **Public Access**: Shared wishlists are publicly accessible without authentication
- **Error Handling**: Graceful handling of clipboard failures and missing requirements

## Architecture & Component Breakdown

### Component Structure

```
features/share-wishlist/
├── components/
│   ├── share-wishlist.tsx      # Main sharing component with clipboard integration
│   └── index.ts               # Component exports
├── index.ts                   # Feature exports
├── PRD.md                     # Comprehensive product requirements
└── CLAUDE.md                  # This documentation file
```

### Component Responsibilities

#### ShareWishlist Component (`/components/share-wishlist.tsx`)

**Lines 1-53**: Main sharing component with the following responsibilities:

- **Props**: `{ userName?: string | null }` - Optional username for URL generation
- **URL Construction** (Lines 29-33): Generates shareable URLs using `window.location.origin` and encoded username
- **Clipboard Integration** (Lines 11, 35-44): Uses `useCopyToClipboard` hook for clipboard operations
- **User Guidance** (Lines 15-26): Redirects to settings when username is missing
- **Error Handling** (Lines 40-44): Graceful clipboard failure handling with user feedback
- **UI Integration** (Lines 47-51): Button component with ShareIcon from Lucide React

## Data Flow

### Client-Side Flow

```
User Click → Username Validation → URL Generation → Clipboard Copy → User Feedback
                     ↓
           Missing Username → Toast Notification → Settings Navigation
```

### Sharing URL Generation Flow

1. **Validation Check** (Lines 15-27): Verifies username exists, shows guidance if missing
2. **URL Construction** (Lines 29-33):
   ```typescript
   const sharedUrl = "/wishlist";
   const origin = window.location.origin;
   const encodedUsername = encodeURIComponent(userName);
   const resultURL = `${origin}${sharedUrl}/${encodedUsername}`;
   ```
3. **Clipboard Operation** (Lines 35-44): Attempts to copy URL, handles success/failure

### Public Wishlist Access Flow

```
Shared URL → App Router → /wishlist/[username]/page.tsx → getWishlistedItemsByUsername → Repository → Database
```

## Integration Points

### 1. Collection Navigation Integration

**File**: `/shared/components/collection-nav.tsx`

- **Usage**: ShareWishlist component integrated into collection navigation
- **Props Flow**: `userName` passed from parent components
- **Conditional Rendering**: Shows on wishlist pages (`isWishlist || showShareWishlist`)

### 2. Public Wishlist Page

**File**: `/app/wishlist/[username]/page.tsx`

- **Route Pattern**: `/wishlist/[username]` - Dynamic route for shared wishlists
- **Server Action**: Uses `getWishlistedItemsByUsername` for public data access
- **Rendering**: Shows user's wishlist with game cards and owner identification
- **Authentication**: Public access (no auth required)

### 3. Server Actions Integration

**File**: `/features/view-wishlist/server-actions/get-wishlisted-items.ts`

- **Public Action**: `getWishlistedItemsByUsername` (Lines 32-51)
- **Validation**: Zod schema validation for username parameter
- **Repository**: Uses `getWishlistedItemsByUsername` repository function
- **Data Processing**: Groups wishlisted items by game ID using utility function

### 4. Repository Layer Integration

**File**: `/shared/lib/repository/backlog/backlog-repository.ts`

- **Function**: `getWishlistedItemsByUsername({ username })`
- **Database Query**: Finds backlog items with WISHLIST status for specific username
- **Privacy**: Public data access through username lookup

## TypeScript Patterns & Validation

### Component Props Interface

```typescript
// Implicit interface from component signature
interface ShareWishlistProps {
  userName?: string | null;
}
```

### Server Action Validation

```typescript
// From get-wishlisted-items.ts lines 37-38
.inputSchema(z.object({ username: z.string() }))
.action(async ({ parsedInput: { username } }) => {
```

### Data Types Integration

Uses types from `view-wishlist` feature:

- `GameWithBacklogItems`: Grouped game data with associated backlog items
- `BacklogItemWithGame`: Backlog items with full game information

## Key Dependencies

### External Dependencies

- **`usehooks-ts`** (v3.1.0): Provides `useCopyToClipboard` hook for clipboard operations
- **`sonner`**: Toast notification system for user feedback
- **`lucide-react`**: ShareIcon component for UI
- **`next/navigation`**: Router hook for programmatic navigation

### Internal Dependencies

- **`@/shared/components/ui/button`**: Consistent button styling
- **`@/shared/lib/safe-action-client`**: Type-safe server actions (`publicActionClient`)
- **`@/shared/lib/repository`**: Data access layer for wishlist operations

## Error Handling Patterns

### Username Validation (Lines 15-26)

```typescript
if (!userName) {
  toast.info("Username not set", {
    description: "Please set a username to share your wishlist",
    action: {
      label: "Set username",
      onClick: () => router.push("/user/settings"),
    },
  });
  return;
}
```

### Clipboard Error Handling (Lines 40-44)

```typescript
try {
  await copy(resultURL);
  toast.success("Success", {
    description: "Wishlist link copied to clipboard",
  });
} catch (e) {
  toast.error("Error", {
    description: e instanceof Error ? e.message : "Failed to copy",
  });
}
```

## Security Considerations

### URL Encoding

- **Username Encoding** (Line 31): Uses `encodeURIComponent(userName)` to prevent injection
- **Safe URL Construction**: Builds URLs from trusted components and encoded user input

### Public Data Access

- **Public Visibility**: Shared wishlists are intentionally public by design
- **Username-Based Access**: Uses username (not user ID) for human-readable URLs
- **No Sensitive Data**: Only exposes game preferences, not personal information

## Testing Strategy

### Current State

- **No Tests Present**: Feature currently lacks unit or integration tests
- **Manual Testing Required**: Clipboard functionality needs cross-browser testing

### Recommended Testing Approach

```typescript
// Suggested test structure
describe("ShareWishlist", () => {
  describe("with valid username", () => {
    it("should generate correct URL format");
    it("should copy URL to clipboard successfully");
    it("should show success notification");
  });

  describe("without username", () => {
    it("should show username setup guidance");
    it("should navigate to settings page");
  });

  describe("clipboard failures", () => {
    it("should handle clipboard API errors gracefully");
    it("should show error message with fallback options");
  });
});
```

## Development Notes

### Code Style Adherence

- **Functional Components**: Uses modern React patterns with hooks
- **Type Safety**: Proper TypeScript usage with optional props
- **Error Boundaries**: Comprehensive error handling for user experience
- **Accessibility**: Uses semantic button component with proper labeling

### Performance Considerations

- **Client-Side Only**: Component uses "use client" directive for browser APIs
- **Minimal Bundle Impact**: Lightweight implementation with focused dependencies
- **Efficient Rendering**: No unnecessary re-renders or side effects

### Future Enhancement Opportunities

Based on PRD recommendations (Lines 262-294):

1. **Enhanced Sharing Options**: Social media buttons, email templates, QR codes
2. **Sharing Analytics**: Track sharing success rates and engagement
3. **Privacy Controls**: Optional privacy settings for shared wishlists
4. **Custom Messaging**: Personalized sharing messages and descriptions

## File References Summary

| File Path                                                        | Responsibility          | Key Lines                             |
| ---------------------------------------------------------------- | ----------------------- | ------------------------------------- |
| `/components/share-wishlist.tsx`                                 | Main sharing component  | 1-53 (full component)                 |
| `/app/wishlist/[username]/page.tsx`                              | Public wishlist display | 8-57 (page component)                 |
| `/features/view-wishlist/server-actions/get-wishlisted-items.ts` | Public data access      | 32-51 (public action)                 |
| `/shared/components/collection-nav.tsx`                          | Navigation integration  | Lines with ShareWishlist import/usage |
| `/shared/lib/repository/backlog/backlog-repository.ts`           | Database operations     | getWishlistedItemsByUsername function |

This feature exemplifies clean, focused implementation with proper error handling, user guidance, and integration with the broader application architecture.
