# Technical Specification: Gaming Journal

- **Functional Specification:** [004-gaming-journal/functional-spec.md](./functional-spec.md)
- **Status:** Draft
- **Author(s):** [To be filled]

---

## 1. High-Level Technical Approach

The Gaming Journal feature will be implemented as a new feature module following SavePoint's Feature-Sliced Design architecture. The implementation will leverage existing infrastructure:

- **Database Schema:** The `JournalEntry` model already exists in Prisma schema with most required fields
- **Architecture Pattern:** Server Actions → Service Layer → Repository Layer → Prisma
- **Rich Text Editor:** Integrate a WYSIWYG editor component (Tiptap recommended for React/Next.js compatibility)
- **Routes:** Create Next.js App Router pages for `/journal` (timeline), `/journal/[id]` (detail), and `/journal/[id]/edit` (edit)

**Key Implementation Areas:**
1. Extend `JournalService` with CRUD operations (create, update, delete, find by user)
2. Extend `JournalRepository` with corresponding database operations
3. Create server actions for journal entry mutations
4. Build UI components for forms, timeline, and detail views
5. Integrate rich text editor for content editing
6. Add pagination support for journal timeline

**Note on Field Naming:** The database schema uses `playSession` (Int?) but the functional spec refers to "Hours Played". **Decision:** We will use the existing `playSession` field to store hours played (manual input). The field name will remain as-is for consistency with existing schema.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### Architecture Changes

**New Feature Module:** `features/journal/`

Following the existing feature structure pattern:
```
features/journal/
├── ui/
│   ├── journal-entry-form.tsx          # Create/edit form with rich text editor
│   ├── journal-entry-form.types.ts
│   ├── journal-timeline.tsx            # Timeline view component
│   ├── journal-timeline.types.ts
│   ├── journal-entry-card.tsx          # Entry card for timeline
│   ├── journal-entry-detail.tsx        # Full entry detail view
│   ├── journal-entry-detail.types.ts
│   └── index.ts
├── server-actions/
│   ├── create-journal-entry.ts
│   ├── update-journal-entry.ts
│   ├── delete-journal-entry.ts
│   └── index.ts
├── schemas.ts                           # Zod validation schemas
├── types.ts                             # Feature-specific types
└── index.ts
```

**No architectural changes** - follows existing patterns from `manage-library-entry` feature.

### Data Model / Database Changes

**Current Schema Analysis:**
The `JournalEntry` model already exists with:
- `id` (String, cuid)
- `title` (String?, optional)
- `content` (String, @db.Text) - **Ready for rich text HTML**
- `mood` (JournalMood?, optional enum)
- `playSession` (Int?, optional) - **Used for "Hours Played"**
- `visibility` (JournalVisibility, default PRIVATE)
- `userId`, `gameId`, `libraryItemId` (relationships)
- `createdAt`, `updatedAt`, `publishedAt` (timestamps)

**Required Changes:**
- ✅ **No schema changes needed** - existing model supports all requirements
- **Field Mapping Clarification:** `playSession` field will store hours played (manual input). The field name is slightly misleading but functional.

**Indexes:**
- Existing indexes are sufficient:
  - `@@index([userId, createdAt])` - Supports timeline queries ordered by update time
  - `@@index([gameId])` - Supports game detail page queries
  - `@@index([libraryItemId])` - Supports library item linking

**Migration Required:** None - schema already supports requirements.

### API Contracts

**Server Actions** (following `createServerAction` pattern):

1. **`createJournalEntry`**
   - **Input Schema:** `CreateJournalEntrySchema` (Zod)
     ```typescript
     {
       gameId: string;
       title: string;
       content: string; // HTML from rich text editor
       mood?: JournalMood;
       playSession?: number; // Hours played
       libraryItemId?: number;
     }
     ```
   - **Returns:** `JournalEntryDomain`
   - **Authorization:** Requires authenticated user
   - **Path Revalidation:** `/journal`, `/games/[slug]`

2. **`updateJournalEntry`**
   - **Input Schema:** `UpdateJournalEntrySchema` (Zod)
     ```typescript
     {
       entryId: string;
       title?: string;
       content?: string; // HTML from rich text editor
       mood?: JournalMood | null;
       playSession?: number | null;
       libraryItemId?: number | null;
     }
     ```
   - **Returns:** `JournalEntryDomain`
   - **Authorization:** Requires authenticated user + ownership check
   - **Path Revalidation:** `/journal/[id]`, `/journal`, `/games/[slug]`

3. **`deleteJournalEntry`**
   - **Input Schema:** `DeleteJournalEntrySchema` (Zod)
     ```typescript
     {
       entryId: string;
     }
     ```
   - **Returns:** `void`
   - **Authorization:** Requires authenticated user + ownership check
   - **Path Revalidation:** `/journal`, `/games/[slug]`

**No API Routes Required** - Server Actions handle all mutations (following existing pattern).

### Component Breakdown

#### 1. Rich Text Editor Component

**Library Selection:** **Tiptap** ✅ **Confirmed**
- **Rationale:** 
  - React-friendly, headless editor
  - Good Next.js compatibility
  - Supports required formatting (bold, italic, lists, paragraphs)
  - Extensible for future features
  - Active maintenance and community support
  - Built-in HTML sanitization (no additional library needed)
- **Package:** `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-list-item`

**Component:** `shared/components/rich-text-editor.tsx`
- Wrapper around Tiptap with shadcn/ui styling
- Exports HTML string for storage
- Parses HTML for editing mode
- Character counter (shows remaining characters out of 1000)
- Validation: Ensures non-empty content after stripping HTML tags
- Validation: Enforces 1000 character limit (HTML string length)

#### 2. Journal Entry Form Component

**Location:** `features/journal/ui/journal-entry-form.tsx`

**Props:**
```typescript
{
  gameId?: string; // Pre-selected game (from game detail page)
  entry?: JournalEntryDomain; // Existing entry (edit mode)
  onSuccess: () => void;
  onCancel?: () => void;
}
```

**Features:**
- Title input (required)
- Rich text editor for content (required, 1000 character limit with counter)
- Mood select dropdown (optional)
- Hours played number input (optional, maps to `playSession`)
- Library item select (optional, auto-linked if only one library item exists)
- Form validation with React Hook Form + Zod
- Submit/Cancel buttons

**Modes:**
- **Create Mode:** `gameId` provided or game selection required
- **Edit Mode:** `entry` provided, form pre-populated

#### 3. Journal Timeline Component

**Location:** `features/journal/ui/journal-timeline.tsx`

**Features:**
- Fetches entries via Server Component (ordered by `updatedAt DESC`)
- Displays paginated list of `JournalEntryCard` components
- Empty state with "Write Your First Entry" button
- "Write New Entry" button (opens form/modal)
- Pagination controls (Load More or page numbers)

**Entry Card Display:**
- Entry title
- Content preview (100 chars, HTML stripped)
- Timestamp (formatted)
- Game name + small cover image
- Mood indicator badge (if set)
- Clickable → navigates to `/journal/[id]`

#### 4. Journal Entry Detail Component

**Location:** `features/journal/ui/journal-entry-detail.tsx`

**Features:**
- Displays full entry with rich text content rendered as HTML
- Game information card (name, cover, link to game detail)
- Entry metadata (created, updated, mood, hours played)
- Edit button → `/journal/[id]/edit`
- Delete button → confirmation dialog → server action

#### 5. Game Selection Component (for `/journal` write flow)

**Location:** `features/journal/ui/game-selector.tsx`

**Features:**
- Search/select game from user's library
- Used when creating entry from `/journal` page (no pre-selected game)

### Logic / Algorithm

#### 1. Content Validation

**Requirement:** Content must be non-empty after stripping HTML tags.

**Implementation:**
```typescript
function isContentEmpty(htmlContent: string): boolean {
  // Strip HTML tags and decode entities
  const textContent = htmlContent
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&[a-z]+;/gi, '') // Remove other HTML entities
    .trim();
  return textContent.length === 0;
}
```

**Zod Schema:**
```typescript
const JournalContentSchema = z.string()
  .min(1, "Content is required")
  .max(1000, "Content cannot exceed 1000 characters") // ✅ Character limit: 1000
  .refine(
    (html) => !isContentEmpty(html),
    "Content cannot be empty"
  );
```

**Note:** Character limit applies to HTML string length (including tags). Consider counting text content only for better UX - implementation decision during development.

#### 2. Timeline Pagination

**Query Pattern:**
```typescript
// Repository function
findJournalEntriesByUserId({
  userId: string;
  limit: number; // e.g., 20
  cursor?: string; // entry.id for cursor-based pagination
})
```

**Ordering:** `updatedAt DESC` (most recently updated first)

**Pagination Strategy:** **Cursor-based pagination** ✅ **Confirmed**
- More efficient than offset for large datasets
- Initial load: First 20 entries
- Load More: Fetch next 20 entries after last entry ID
- Uses `entry.id` as cursor (stable, unique identifier)

#### 3. Rich Text Content Storage

**Format:** HTML string stored in `content` field (TEXT type in PostgreSQL)

**Sanitization:** **Tiptap's built-in sanitization** ✅ **Confirmed**
- Tiptap sanitizes HTML by default (only allowed tags)
- No additional sanitization library needed
- **Allowed Tags:** `<p>`, `<strong>`, `<em>`, `<ul>`, `<ol>`, `<li>`, `<br>`
- Server-side validation ensures content is valid HTML string

**Rendering:**
- Use `dangerouslySetInnerHTML` with sanitized HTML (or use a safe HTML renderer)
- Apply Tailwind prose classes for styling

#### 4. Library Item Linking Logic

**When to Show Selector:**
- Query: `findLibraryItemsByGameId({ gameId, userId })`
- **If count > 1:** Show dropdown for manual selection
- **If count === 1:** ✅ **Auto-link** (automatically set `libraryItemId`)
- **If count === 0:** Don't show selector (entry still valid without link)

### Routes / Pages

**Next.js App Router Pages:**

1. **`app/journal/page.tsx`** (Timeline)
   - Server Component
   - Fetches entries via `JournalService.findJournalEntriesByUserId()`
   - Renders `JournalTimeline` component
   - Requires authentication (redirect if not logged in)

2. **`app/journal/[id]/page.tsx`** (Detail)
   - Server Component
   - Fetches entry via `JournalService.findJournalEntryById()`
   - Ownership check (404 if not owner)
   - Renders `JournalEntryDetail` component

3. **`app/journal/[id]/edit/page.tsx`** (Edit)
   - Server Component
   - Fetches entry via `JournalService.findJournalEntryById()`
   - Ownership check (404 if not owner)
   - Renders `JournalEntryForm` in edit mode

4. **`app/journal/new/page.tsx`** (Create from timeline)
   - Server Component (or Client Component with modal)
   - Renders `GameSelector` → `JournalEntryForm`
   - Alternative: Modal/dialog approach (simpler UX)

**Integration Points:**

- **Game Detail Page:** Update `JournalEntriesSection` component
  - Enable "Write New Entry" button
  - Link to `/journal/new?gameId=[gameId]` or open modal
- **Navigation:** Add "Journal" link to main navigation

### Service Layer Extensions

**Extend `JournalService`** (`data-access-layer/services/journal/journal-service.ts`):

```typescript
class JournalService extends BaseService {
  // Existing: findJournalEntriesByGameId()
  
  // New methods:
  async createJournalEntry(params: {
    userId: string;
    gameId: string;
    title: string;
    content: string; // HTML
    mood?: JournalMood;
    playSession?: number;
    libraryItemId?: number;
  }): Promise<ServiceResult<JournalEntryDomain>>
  
  async findJournalEntryById(params: {
    entryId: string;
    userId: string;
  }): Promise<ServiceResult<JournalEntryDomain>>
  
  async findJournalEntriesByUserId(params: {
    userId: string;
    limit?: number;
    cursor?: string;
  }): Promise<ServiceResult<JournalEntryDomain[]>>
  
  async updateJournalEntry(params: {
    userId: string;
    entryId: string;
    updates: {
      title?: string;
      content?: string;
      mood?: JournalMood | null;
      playSession?: number | null;
      libraryItemId?: number | null;
    };
  }): Promise<ServiceResult<JournalEntryDomain>>
  
  async deleteJournalEntry(params: {
    userId: string;
    entryId: string;
  }): Promise<ServiceResult<void>>
}
```

### Repository Layer Extensions

**Extend `JournalRepository`** (`data-access-layer/repository/journal/journal-repository.ts`):

```typescript
// Existing: findJournalEntriesByGameId(), countJournalEntriesByGameId()

// New functions:
export async function createJournalEntry(params: {
  userId: string;
  gameId: string;
  title: string;
  content: string;
  mood?: JournalMood;
  playSession?: number;
  libraryItemId?: number;
}): Promise<RepositoryResult<JournalEntry>>

export async function findJournalEntryById(params: {
  entryId: string;
  userId: string;
}): Promise<RepositoryResult<JournalEntry>>

export async function findJournalEntriesByUserId(params: {
  userId: string;
  limit: number;
  cursor?: string;
}): Promise<RepositoryResult<JournalEntry[]>>

export async function updateJournalEntry(params: {
  entryId: string;
  userId: string;
  updates: {
    title?: string;
    content?: string;
    mood?: JournalMood | null;
    playSession?: number | null;
    libraryItemId?: number | null;
  };
}): Promise<RepositoryResult<JournalEntry>>

export async function deleteJournalEntry(params: {
  entryId: string;
  userId: string;
}): Promise<RepositoryResult<void>>
```

**Authorization Pattern:**
- All repository functions include `userId` in `where` clauses
- Prevents horizontal privilege escalation (users can't access/modify other users' entries)

---

## 3. Impact and Risk Analysis

### System Dependencies

**New Dependencies:**
- `@tiptap/react` - Rich text editor core
- `@tiptap/starter-kit` - Basic formatting extensions (includes built-in sanitization)
- `@tiptap/extension-list-item` - List support
- `@tiptap/extension-character-count` - Character count (required for 1000 character limit)

**Estimated Bundle Size Impact:** ~50-70KB gzipped (Tiptap + extensions)

**Existing Dependencies Used:**
- React Hook Form (already in use)
- Zod (already in use)
- shadcn/ui components (already in use)
- next-safe-action pattern (already in use)

### Potential Risks & Mitigations

#### 1. **Rich Text Editor Performance**

**Risk:** Large HTML content may slow down editor initialization or rendering.

**Mitigation:**
- Lazy load editor component (only when form is opened)
- Implement content length limits (e.g., 10,000 characters) if needed
- Use React.memo for entry cards in timeline

#### 2. **XSS Vulnerabilities from HTML Content**

**Risk:** Stored HTML content could contain malicious scripts if not properly sanitized.

**Mitigation:**
- **Client-side:** Tiptap sanitizes by default (only allowed tags) ✅
- **Server-side:** Tiptap's built-in sanitization is sufficient (no additional library needed) ✅
- **Rendering:** Use safe HTML rendering approach (sanitize before `dangerouslySetInnerHTML` if needed)
- **Content Security Policy:** Ensure CSP headers prevent inline scripts
- **Content Length:** 1000 character limit reduces attack surface ✅

#### 3. **Database Performance (Timeline Queries)**

**Risk:** Large number of journal entries per user could slow down timeline queries.

**Mitigation:**
- Existing index `@@index([userId, createdAt])` supports efficient queries
- Implement pagination (cursor-based preferred)
- Monitor query performance in production
- Consider adding `@@index([userId, updatedAt])` if `updatedAt` ordering becomes bottleneck

#### 4. **Content Validation Edge Cases**

**Risk:** Users might submit content with only whitespace or formatting tags, bypassing validation.

**Mitigation:**
- Implement `isContentEmpty()` function that strips HTML before validation
- Server-side validation in Zod schema (refine method)
- Clear error messages for users

#### 5. **Rich Text Editor Learning Curve**

**Risk:** Users unfamiliar with rich text editors may struggle with formatting.

**Mitigation:**
- Provide clear placeholder text with formatting hints
- Toolbar icons should be intuitive (bold = B, italic = I)
- Consider adding a "Help" tooltip or documentation link
- Test with real users during beta

#### 6. **Field Name Confusion (`playSession` vs "Hours Played")**

**Risk:** `playSession` field name doesn't match UI label "Hours Played", could cause confusion in code reviews.

**Mitigation:**
- Add clear comments in code explaining the mapping ✅ **Decision: Keep field name as-is**
- Document in code comments and technical spec
- UI label will display "Hours Played" while database field remains `playSession`

#### 7. **Content Length Limit**

**Risk:** Users may exceed 1000 character limit, causing frustration.

**Mitigation:**
- ✅ **Character limit: 1000 characters** (including HTML tags)
- Show character count in editor (Tiptap extension)
- Clear error message when limit exceeded
- Consider counting text content only (excluding HTML tags) for better UX - implementation decision

#### 8. **Library Item Auto-Linking**

**Risk:** Auto-linking when only one library item exists may surprise users who don't want to link.

**Mitigation:**
- ✅ **Decision: Auto-link if only one library item exists**
- Make linking optional (users can unlink if needed)
- Show clear indication when entry is auto-linked
- Consider allowing users to unlink in edit mode

---

## 4. Testing Strategy

### Unit Tests

**Service Layer:**
- `JournalService.createJournalEntry()` - Success and error cases
- `JournalService.updateJournalEntry()` - Ownership validation, update logic
- `JournalService.deleteJournalEntry()` - Ownership validation
- `JournalService.findJournalEntryById()` - Ownership check, not found cases
- Content validation logic (`isContentEmpty()`)

**Repository Layer:**
- `createJournalEntry()` - Database insertion, foreign key constraints
- `updateJournalEntry()` - Update logic, `updatedAt` timestamp update
- `deleteJournalEntry()` - Deletion, cascade behavior
- `findJournalEntriesByUserId()` - Pagination, ordering by `updatedAt DESC`

**Test Files:**
- `journal-service.unit.test.ts`
- `journal-repository.integration.test.ts` (uses real PostgreSQL)

### Integration Tests

**Server Actions:**
- `createJournalEntry` - Full flow: validation → service → repository → database
- `updateJournalEntry` - Ownership check, update flow
- `deleteJournalEntry` - Ownership check, deletion flow
- Error handling (unauthorized, not found, validation errors)

**Test Files:**
- `create-journal-entry.integration.test.ts`
- `update-journal-entry.integration.test.ts`
- `delete-journal-entry.integration.test.ts`

### Component Tests

**UI Components:**
- `JournalEntryForm` - Form validation, submission, error states
- `JournalTimeline` - Entry rendering, pagination, empty state
- `JournalEntryDetail` - Content rendering, edit/delete button actions
- Rich text editor - Basic formatting (bold, italic, lists)

**Test Files:**
- `journal-entry-form.test.tsx`
- `journal-timeline.test.tsx`
- `journal-entry-detail.test.tsx`
- `rich-text-editor.test.tsx`

**Testing Library:** Vitest + Testing Library (jsdom environment)

### E2E Tests (Future)

**Critical User Flows:**
1. Create journal entry from game detail page
2. Create journal entry from `/journal` timeline
3. Edit journal entry
4. Delete journal entry (with confirmation)
5. View journal timeline with pagination

**Test Tool:** Playwright (deferred to Phase 2 per architecture doc)

### Test Data Strategy

**Factories:**
- Extend `test/setup/db-factories/journal.ts` with factory for creating test entries
- Support all fields (title, content HTML, mood, playSession, etc.)

**Fixtures:**
- Sample HTML content for rich text testing
- Edge cases: empty HTML, only formatting tags, very long content

---

## 5. Implementation Phases

### Phase 1: Core CRUD Operations
1. Extend `JournalRepository` with create, update, delete, find methods
2. Extend `JournalService` with corresponding business logic
3. Create server actions (create, update, delete)
4. Add Zod schemas for validation

### Phase 2: UI Components (Basic)
1. Create `JournalEntryForm` component (plain textarea initially)
2. Create `JournalTimeline` component
3. Create `JournalEntryDetail` component
4. Create routes (`/journal`, `/journal/[id]`, `/journal/[id]/edit`)

### Phase 3: Rich Text Editor Integration
1. Install Tiptap dependencies (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-list-item`, `@tiptap/extension-character-count`)
2. Create `RichTextEditor` component with character counter (1000 limit)
3. Integrate into `JournalEntryForm`
4. Update content rendering to display HTML (Tiptap's built-in sanitization handles security)

### Phase 4: Polish & Integration
1. Update `JournalEntriesSection` on game detail page (enable buttons)
2. Add navigation link to Journal
3. Add pagination to timeline
4. Add confirmation dialog for delete
5. Error handling and loading states

### Phase 5: Testing
1. Write unit tests for service layer
2. Write integration tests for repository layer
3. Write component tests for UI
4. Manual testing of user flows

---

## 6. Decisions Summary

✅ **All decisions confirmed:**

1. **Field Name:** Keep `playSession` as-is (stores "Hours Played", UI label will differ)
2. **Rich Text Editor:** Tiptap confirmed
3. **Pagination:** Cursor-based pagination confirmed
4. **HTML Sanitization:** Tiptap's built-in sanitization (no additional library)
5. **Content Length Limit:** 1000 characters (including HTML tags)
6. **Library Item Auto-Link:** Auto-link if user has only one library item for the game

**Implementation Notes:**
- Character counting: Consider counting text content only (excluding HTML tags) for better UX
- Auto-linking: Show clear indication when entry is auto-linked, allow unlinking in edit mode

