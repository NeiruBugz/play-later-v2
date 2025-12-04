# Task List: Gaming Journal Feature

**Specification:** 004-gaming-journal  
**Approach:** Backend-first with Test-Driven Development (TDD)  
**Principle:** Each slice must be runnable and testable independently

---

## Backend Implementation (TDD)

### **Slice 1: Create Journal Entry (Backend)**

#### Repository Layer (TDD)
- [x] Write integration test for `createJournalEntry()` repository function in `journal-repository.integration.test.ts`:
  - Test successful creation with all required fields (userId, gameId, title, content)
  - Test successful creation with optional fields (mood, playSession, libraryItemId)
  - Test database constraint violations (invalid userId, invalid gameId)
  - Test that `createdAt` and `updatedAt` timestamps are set correctly
  **[Agent: testing-expert]**

- [x] Implement `createJournalEntry()` function in `journal-repository.ts` to make tests pass. **[Agent: nextjs-backend-expert]**

#### Service Layer (TDD)
- [x] Write unit test for `JournalService.createJournalEntry()` method in `journal-service.unit.test.ts`:
  - Test successful creation (mock repository success)
  - Test repository error handling
  - Test input validation (required fields)
  - Test that domain model is correctly mapped from repository result
  **[Agent: testing-expert]**

- [x] Implement `createJournalEntry()` method in `journal-service.ts` to make tests pass. **[Agent: nextjs-backend-expert]**

#### Server Action Layer (TDD)
- [x] Create Zod schema `CreateJournalEntrySchema` in `features/journal/schemas.ts`:
  - `gameId`: string (required)
  - `title`: string (required, min 1)
  - `content`: string (required, min 1) - plain text initially
  - `mood`: JournalMood enum (optional)
  - `playSession`: number (optional, positive integer)
  - `libraryItemId`: number (optional, positive integer)
  **[Agent: nextjs-backend-expert]**

- [x] Write server action test for `createJournalEntry` in `create-journal-entry.server-action.test.ts`:
  - Test successful creation (mock service success)
  - Test authentication requirement
  - Test validation errors (empty title, empty content)
  - Test service error handling
  - Test path revalidation (`/journal`, `/games/[slug]`)
  **[Agent: testing-expert]**

- [x] Implement `createJournalEntry` server action in `features/journal/server-actions/create-journal-entry.ts` to make tests pass. **[Agent: nextjs-backend-expert]**

---

### **Slice 2: Find Journal Entry by ID (Backend)**

#### Repository Layer (TDD)
- [x] Write integration test for `findJournalEntryById()` repository function:
  - Test successful retrieval when entry exists and user owns it
  - Test returns error when entry doesn't exist
  - Test returns error when entry exists but user doesn't own it (ownership check)
  - Test that all fields are correctly retrieved
  **[Agent: testing-expert]**

- [x] Implement `findJournalEntryById()` function in `journal-repository.ts` to make tests pass. **[Agent: nextjs-backend-expert]**

#### Service Layer (TDD)
- [x] Write unit test for `JournalService.findJournalEntryById()` method:
  - Test successful retrieval (mock repository success)
  - Test repository error handling (not found, ownership violation)
  - Test that domain model is correctly mapped
  **[Agent: testing-expert]**

- [x] Implement `findJournalEntryById()` method in `journal-service.ts` to make tests pass. **[Agent: nextjs-backend-expert]**

---

### **Slice 3: Find Journal Entries by User ID (Backend)**

#### Repository Layer (TDD)
- [x] Write integration test for `findJournalEntriesByUserId()` repository function:
  - Test returns empty array when user has no entries
  - Test returns entries ordered by `updatedAt DESC` (most recently updated first)
  - Test cursor-based pagination (first page with limit, subsequent pages with cursor)
  - Test that only entries belonging to the user are returned
  - Test pagination edge cases (cursor points to non-existent entry, limit boundaries)
  **[Agent: testing-expert]**

- [x] Implement `findJournalEntriesByUserId()` function in `journal-repository.ts` to make tests pass. **[Agent: nextjs-backend-expert]**

#### Service Layer (TDD)
- [x] Write unit test for `JournalService.findJournalEntriesByUserId()` method:
  - Test successful retrieval with pagination (mock repository success)
  - Test repository error handling
  - Test that domain models are correctly mapped
  - Test default limit handling
  **[Agent: testing-expert]**

- [x] Implement `findJournalEntriesByUserId()` method in `journal-service.ts` to make tests pass. **[Agent: nextjs-backend-expert]**

---

### **Slice 4: Update Journal Entry (Backend)**

#### Repository Layer (TDD)
- [x] Write integration test for `updateJournalEntry()` repository function:
  - Test successful update of all fields (title, content, mood, playSession, libraryItemId)
  - Test partial updates (only some fields provided)
  - Test that `updatedAt` timestamp is automatically updated
  - Test ownership check (returns error if user doesn't own entry)
  - Test returns error when entry doesn't exist
  - Test setting optional fields to null (mood, playSession, libraryItemId)
  **[Agent: testing-expert]**

- [x] Implement `updateJournalEntry()` function in `journal-repository.ts` to make tests pass. **[Agent: nextjs-backend-expert]**

#### Service Layer (TDD)
- [x] Write unit test for `JournalService.updateJournalEntry()` method:
  - Test successful update (mock repository success)
  - Test repository error handling (not found, ownership violation)
  - Test that domain model is correctly mapped after update
  - Test partial update scenarios
  **[Agent: testing-expert]**

- [x] Implement `updateJournalEntry()` method in `journal-service.ts` to make tests pass. **[Agent: nextjs-backend-expert]**

#### Server Action Layer (TDD)
- [x] Create Zod schema `UpdateJournalEntrySchema` in `features/journal/schemas.ts`:
  - `entryId`: string (required)
  - `title`: string (optional, min 1 if provided)
  - `content`: string (optional, min 1 if provided) - plain text initially
  - `mood`: JournalMood enum | null (optional)
  - `playSession`: number | null (optional, positive integer if provided)
  - `libraryItemId`: number | null (optional, positive integer if provided)
  **[Agent: nextjs-backend-expert]**

- [x] Write server action test for `updateJournalEntry` in `update-journal-entry.server-action.test.ts`:
  - Test successful update (mock service success)
  - Test authentication requirement
  - Test validation errors (empty title/content if provided)
  - Test service error handling (not found, ownership violation)
  - Test path revalidation (`/journal/[id]`, `/journal`, `/games/[slug]`)
  **[Agent: testing-expert]**

- [x] Implement `updateJournalEntry` server action in `features/journal/server-actions/update-journal-entry.ts` to make tests pass. **[Agent: nextjs-backend-expert]**

---

### **Slice 5: Delete Journal Entry (Backend)**

#### Repository Layer (TDD)
- [ ] Write integration test for `deleteJournalEntry()` repository function:
  - Test successful deletion when entry exists and user owns it
  - Test returns error when entry doesn't exist
  - Test returns error when entry exists but user doesn't own it (ownership check)
  - Test that entry is permanently deleted from database
  **[Agent: testing-expert]**

- [ ] Implement `deleteJournalEntry()` function in `journal-repository.ts` to make tests pass. **[Agent: nextjs-backend-expert]**

#### Service Layer (TDD)
- [ ] Write unit test for `JournalService.deleteJournalEntry()` method:
  - Test successful deletion (mock repository success)
  - Test repository error handling (not found, ownership violation)
  **[Agent: testing-expert]**

- [ ] Implement `deleteJournalEntry()` method in `journal-service.ts` to make tests pass. **[Agent: nextjs-backend-expert]**

#### Server Action Layer (TDD)
- [ ] Create Zod schema `DeleteJournalEntrySchema` in `features/journal/schemas.ts`:
  - `entryId`: string (required)
  **[Agent: nextjs-backend-expert]**

- [ ] Write server action test for `deleteJournalEntry` in `delete-journal-entry.server-action.test.ts`:
  - Test successful deletion (mock service success)
  - Test authentication requirement
  - Test service error handling (not found, ownership violation)
  - Test path revalidation (`/journal`, `/games/[slug]`)
  **[Agent: testing-expert]**

- [ ] Implement `deleteJournalEntry` server action in `features/journal/server-actions/delete-journal-entry.ts` to make tests pass. **[Agent: nextjs-backend-expert]**

---

## Frontend Implementation

### **Slice 6: Empty Journal Timeline Page**

- [ ] Create `/journal` route page (`app/journal/page.tsx`) that:
  - Requires authentication (redirects if not logged in)
  - Shows empty state with "No journal entries yet" message
  - Shows disabled "Write Your First Entry" button
  **[Agent: nextjs-ui-expert]**

---

### **Slice 7: Create Journal Entry Form (Plain Text)**

- [ ] Create `JournalEntryForm` component in `features/journal/ui/journal-entry-form.tsx`:
  - Title input (required)
  - Plain textarea for content (required)
  - Optional mood select dropdown (EXCITED, RELAXED, FRUSTRATED, ACCOMPLISHED, CURIOUS, NOSTALGIC)
  - Optional hours played number input (maps to `playSession`)
  - Optional library item selector (query library items by gameId)
  - Form validation with React Hook Form + Zod
  - Submit/Cancel buttons
  - Handles create mode (gameId prop or game selection required)
  **[Agent: nextjs-ui-expert]**

- [ ] Create `/journal/new` route page that renders `JournalEntryForm`:
  - Accepts optional `gameId` query parameter
  - If `gameId` provided, pre-selects game
  - If no `gameId`, shows game selector first
  - Calls `createJournalEntry` server action on submit
  - Redirects to `/journal/[id]` on success
  **[Agent: nextjs-ui-expert]**

- [ ] Update `/journal` page to enable "Write Your First Entry" button and link to `/journal/new`. **[Agent: nextjs-ui-expert]**

- [ ] Add component tests for `JournalEntryForm`:
  - Form validation (required fields, error states)
  - Submission flow
  - Game selection flow
  **[Agent: testing-expert]**

---

### **Slice 8: View Individual Journal Entry (Plain Text)**

- [ ] Create `JournalEntryDetail` component in `features/journal/ui/journal-entry-detail.tsx`:
  - Displays entry title
  - Displays plain text content
  - Displays game information card (name, cover image, link to game detail)
  - Displays entry metadata (created date, updated date, mood if set, hours played if set)
  - Edit button (links to `/journal/[id]/edit`)
  - Delete button (placeholder, not functional yet)
  **[Agent: nextjs-ui-expert]**

- [ ] Create `/journal/[id]/page.tsx` route that:
  - Fetches entry via `JournalService.findJournalEntryById()`
  - Validates ownership (shows 404 if not found or not owned)
  - Renders `JournalEntryDetail` component
  **[Agent: nextjs-ui-expert]**

- [ ] Add component tests for `JournalEntryDetail`:
  - Renders all entry fields correctly
  - Handles missing optional fields
  - Edit button navigation
  **[Agent: testing-expert]**

---

### **Slice 9: View Journal Timeline with Entries**

- [ ] Create `JournalEntryCard` component in `features/journal/ui/journal-entry-card.tsx`:
  - Displays entry title (or "Untitled Entry" if null)
  - Displays content preview (first 100 characters of plain text)
  - Displays formatted timestamp (last updated date)
  - Displays game name and small cover image
  - Displays mood indicator badge (if set)
  - Clickable → navigates to `/journal/[id]`
  **[Agent: nextjs-ui-expert]**

- [ ] Create `JournalTimeline` component in `features/journal/ui/journal-timeline.tsx`:
  - Fetches entries via Server Component using `JournalService.findJournalEntriesByUserId()`
  - Displays paginated list of `JournalEntryCard` components
  - Shows empty state if no entries
  - "Write New Entry" button
  **[Agent: nextjs-ui-expert]**

- [ ] Update `/journal` page to fetch entries and render `JournalTimeline` component. **[Agent: nextjs-ui-expert]**

- [ ] Add component tests for `JournalEntryCard` and `JournalTimeline`:
  - Entry card rendering
  - Timeline pagination display
  - Empty state handling
  **[Agent: testing-expert]**

---

### **Slice 10: Edit Journal Entry (Plain Text)**

- [ ] Create `/journal/[id]/edit/page.tsx` route that:
  - Fetches entry via `JournalService.findJournalEntryById()`
  - Validates ownership (shows 404 if not found or not owned)
  - Renders `JournalEntryForm` in edit mode (pre-populated with existing entry values)
  - Calls `updateJournalEntry` server action on submit
  - Redirects to `/journal/[id]` on success
  **[Agent: nextjs-ui-expert]**

- [ ] Update `JournalEntryForm` component to support edit mode:
  - Accepts optional `entry` prop for edit mode
  - Pre-populates all fields when `entry` is provided
  - Calls `updateJournalEntry` server action instead of `createJournalEntry` in edit mode
  **[Agent: nextjs-ui-expert]**

- [ ] Update `JournalEntryDetail` component to enable Edit button and link to `/journal/[id]/edit`. **[Agent: nextjs-ui-expert]**

- [ ] Add component tests for edit mode:
  - Form pre-population
  - Update submission flow
  **[Agent: testing-expert]**

---

### **Slice 11: Delete Journal Entry**

- [ ] Create delete confirmation dialog component (using shadcn/ui Dialog) in `features/journal/ui/delete-entry-dialog.tsx`. **[Agent: nextjs-ui-expert]**

- [ ] Update `JournalEntryDetail` component to:
  - Enable Delete button
  - Show confirmation dialog on click
  - Call `deleteJournalEntry` server action on confirm
  - Redirect to `/journal` on successful deletion
  - Show success toast message
  **[Agent: nextjs-ui-expert]**

- [ ] Add component tests for delete flow:
  - Confirmation dialog display
  - Delete action execution
  - Error handling
  **[Agent: testing-expert]**

---

### **Slice 12: Integrate Rich Text Editor**

- [ ] Install Tiptap dependencies:
  - `@tiptap/react`
  - `@tiptap/starter-kit`
  - `@tiptap/extension-list-item`
  - `@tiptap/extension-character-count`
  **[Agent: nextjs-ui-expert]**

- [ ] Create `RichTextEditor` component in `shared/components/rich-text-editor.tsx`:
  - Wrapper around Tiptap with shadcn/ui styling
  - Toolbar with formatting buttons (bold, italic, bulleted lists, numbered lists)
  - Character counter showing remaining characters (1000 limit)
  - Exports HTML string for storage
  - Parses HTML for editing mode
  - Validation: Ensures non-empty content after stripping HTML tags
  - Validation: Enforces 1000 character limit (HTML string length)
  **[Agent: nextjs-ui-expert]**

- [ ] Update content validation in Zod schemas (`CreateJournalEntrySchema`, `UpdateJournalEntrySchema`):
  - Add `isContentEmpty()` helper function to strip HTML tags and validate non-empty text
  - Update content validation to check HTML string length (1000 limit)
  - Add refine validation for non-empty content after stripping HTML
  **[Agent: nextjs-backend-expert]**

- [ ] Update `JournalEntryForm` component to use `RichTextEditor` instead of plain textarea. **[Agent: nextjs-ui-expert]**

- [ ] Update `JournalEntryDetail` component to render rich text content as HTML:
  - Use `dangerouslySetInnerHTML` with sanitized HTML
  - Apply Tailwind prose classes for styling
  **[Agent: nextjs-ui-expert]**

- [ ] Update `JournalEntryCard` component to strip HTML tags from content preview (first 100 chars of plain text). **[Agent: nextjs-ui-expert]**

- [ ] Add component tests for `RichTextEditor`:
  - Formatting capabilities (bold, italic, lists)
  - Character limit enforcement
  - Content validation (non-empty after stripping HTML)
  - HTML export/import
  **[Agent: testing-expert]**

---

### **Slice 13: Add Pagination to Timeline**

- [ ] Update `JournalTimeline` component to support "Load More" button:
  - Implement cursor-based pagination using entry ID as cursor
  - Fetch next page when "Load More" is clicked
  - Append new entries to existing list
  - Hide "Load More" button when no more entries
  - Add loading state during pagination
  **[Agent: nextjs-ui-expert]**

- [ ] Add component tests for pagination:
  - Load more functionality
  - Loading states
  - End of list detection
  **[Agent: testing-expert]**

---

### **Slice 14: Integrate with Game Detail Page**

- [ ] Update `JournalEntriesSection` component on game detail page:
  - Enable "Write New Entry" button (currently disabled)
  - Link to `/journal/new?gameId=[gameId]`
  **[Agent: nextjs-ui-expert]**

- [ ] Update library item auto-linking logic in `JournalEntryForm`:
  - Query library items by gameId: `findLibraryItemsByGameId({ gameId, userId })`
  - If count === 1: Auto-link (automatically set `libraryItemId`)
  - If count > 1: Show dropdown for manual selection
  - If count === 0: Don't show selector (entry still valid without link)
  **[Agent: nextjs-backend-expert]**

- [ ] Add navigation link to Journal in main navigation menu. **[Agent: nextjs-ui-expert]**

---

## Notes

- **TDD Approach:** For backend slices, tests are written BEFORE implementation. Each test should fail initially, then implementation makes it pass.
- **Character Limit:** Content limit is 1000 characters (including HTML tags). Consider counting text content only for better UX - implementation decision.
- **Field Mapping:** Database field `playSession` stores "Hours Played" (manual input). UI label displays "Hours Played" while database field remains `playSession`.
- **Auto-linking:** When user has exactly one library item for a game, automatically link the journal entry. Show clear indication when auto-linked, allow unlinking in edit mode.

