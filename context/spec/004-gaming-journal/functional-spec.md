# Functional Specification: Gaming Journal

- **Roadmap Item:** Gaming Journal - Write Journal Entries and View Personal Journal
- **Status:** Draft
- **Author:** [To be filled]

---

## 1. Overview and Rationale (The "Why")

Patient gamers accumulate rich gaming experiences over time, but memories fade. Without a way to capture reflections and thoughts during or after play sessions, users lose the emotional context and insights that made each gaming journey meaningful. The Gaming Journal feature enables users to preserve these memories by writing reflections linked to specific games, creating a personal timeline of their gaming experiences.

**Problem Statement:** Users cannot currently document their thoughts, feelings, and reflections about their gaming experiences, making it difficult to remember what resonated with them or why they enjoyed (or didn't enjoy) a particular game.

**Desired Outcome:** Users can write journal entries about their gaming experiences, view a chronological timeline of all their reflections, and revisit past entries to relive cherished gaming memories.

**Success Metrics:**
- Users regularly create journal entries after play sessions
- Users return to read their past journal entries
- Journal entries help users recall gaming experiences and make intentional decisions about what to play next

---

## 2. Functional Requirements (The "What")

### 2.1. Write Journal Entries

**As a** user, **I want to** write journal entries about my gaming experiences, **so that** I can capture my thoughts, feelings, and memories about games I'm playing or have played.

**Entry Points:**
- Users can start writing a journal entry from a game detail page (`/games/[slug]`)
- Users can start writing a journal entry from the personal journal timeline page (`/journal`)

**Acceptance Criteria:**

- [ ] When I click "Write New Entry" or "Write Your First Entry" on a game detail page, I am presented with a form to create a journal entry for that specific game.
- [ ] When I navigate to `/journal` and click a "Write New Entry" button, I can select a game from my library and then write an entry for it.
- [ ] The journal entry form includes the following fields:
  - **Title** (required, text input): A title for the journal entry
  - **Content** (required, rich text/WYSIWYG editor): The main journal entry content with rich text formatting capabilities (must be non-empty)
  - **Mood** (optional, select): Choose from EXCITED, RELAXED, FRUSTRATED, ACCOMPLISHED, CURIOUS, NOSTALGIC
  - **Hours Played** (optional, number input): The number of hours played for this entry
  - **Link to Library Item** (optional, select): Manually link this entry to a specific library item if the user has multiple entries for the same game
- [ ] The content field provides a rich text/WYSIWYG editor that supports at minimum: bold, italic, bulleted lists, numbered lists, and paragraph formatting.
- [ ] When I submit the form with valid required fields (title and non-empty content), the journal entry is created with the formatted content preserved and I see a success message.
- [ ] After successfully creating an entry, I am redirected to view the new entry or returned to the page I came from with the entry visible.
- [ ] If I try to submit the form with an empty title or empty content (including content with only whitespace or formatting tags), I see validation error messages indicating what is required.
- [ ] Users can create multiple journal entries for the same game.

### 2.2. View Personal Journal Timeline

**As a** user, **I want to** view a chronological timeline of all my journal entries, **so that** I can revisit past reflections and see my gaming journey over time.

**Acceptance Criteria:**

- [ ] When I navigate to `/journal`, I see a page titled "My Journal" or similar.
- [ ] Journal entries are displayed in reverse chronological order (most recently updated first, based on `updatedAt` timestamp).
- [ ] Each entry in the timeline displays:
  - Entry title
  - Content preview (first 100 characters of the content, with rich text formatting stripped or rendered as plain text)
  - Timestamp (formatted date/time of last update)
  - Game name
  - Small variant of the game cover image/card
  - Mood indicator (if a mood was selected)
- [ ] When I click on an entry in the timeline, I navigate to `/journal/[id]` to view the full entry details.
- [ ] The timeline supports pagination (e.g., "Load More" or page numbers) to view older entries.
- [ ] If I have no journal entries, I see an empty state with a message like "No journal entries yet" and a button to "Write Your First Entry".

### 2.3. View Individual Journal Entry

**As a** user, **I want to** view the full details of a journal entry, **so that** I can read my complete reflection and see all associated information.

**Acceptance Criteria:**

- [ ] When I navigate to `/journal/[id]`, I see a page displaying:
  - Entry title
  - Full entry content rendered with rich text formatting preserved (bold, italic, lists, etc.)
  - Connected game information (game name, cover image, link to game detail page)
  - Entry metadata (creation date, last updated date, mood if set, hours played if set)
  - Edit button (links to `/journal/[id]/edit`)
  - Delete button
- [ ] If the journal entry does not exist or I don't have permission to view it, I see a 404 error page.
- [ ] The page is only accessible to the entry owner (private entries cannot be viewed by other users).

### 2.4. Edit Journal Entry

**As a** user, **I want to** edit my journal entries, **so that** I can update my reflections or correct mistakes.

**Acceptance Criteria:**

- [ ] When I click "Edit" on a journal entry detail page (`/journal/[id]`), I navigate to `/journal/[id]/edit`.
- [ ] The edit page displays a form pre-populated with the current entry values (title, content with rich text formatting preserved in the editor, mood, hours played, library item link).
- [ ] I can modify any field, including editing the rich text content with full formatting capabilities, and save changes.
- [ ] When I save changes, the entry's `updatedAt` timestamp is updated to reflect the edit time.
- [ ] After successfully saving, I am redirected back to the entry detail page (`/journal/[id]`) and see a success message.
- [ ] Validation rules are the same as creating an entry (title and content are required, content must be non-empty, including after stripping formatting tags).

### 2.5. Delete Journal Entry

**As a** user, **I want to** delete journal entries, **so that** I can remove entries I no longer want to keep.

**Acceptance Criteria:**

- [ ] When I click "Delete" on a journal entry detail page, a confirmation dialog appears asking "Are you sure you want to delete this journal entry?" with options to "Cancel" or "Delete".
- [ ] If I click "Cancel" in the confirmation dialog, the dialog closes and no action is taken.
- [ ] If I click "Delete" in the confirmation dialog, the journal entry is permanently deleted.
- [ ] After successful deletion, I am redirected to `/journal` (the personal journal timeline) and see a success message confirming the deletion.
- [ ] The deleted entry no longer appears in the journal timeline or on the game detail page.

---

## 3. Scope and Boundaries

### In-Scope

- Creating journal entries from game detail pages and the journal timeline page
- Writing journal entries with required fields (title, content) and optional fields (mood, hours played, library item link)
- Rich text/WYSIWYG editor for journal entry content with formatting capabilities (bold, italic, lists, paragraphs)
- Viewing a paginated chronological timeline of all personal journal entries
- Viewing individual journal entry details with rich text formatting rendered
- Editing existing journal entries with rich text editor
- Deleting journal entries with confirmation
- Basic validation (required fields, non-empty content after stripping formatting)
- All journal entries are private by default (only visible to the entry owner)

### Out-of-Scope

**Separate Roadmap Items:**
- **Platform Integration** (Steam Library Import, Steam Metadata Sync)
- **Discovery & Exploration** (Similar Games Discovery, Enhanced Game Details)
- **Curated Collections** (Create Themed Collections, Browse Personal Collections)
- **Community Reflections** (Public Reflections, Browse Community Reflections, User Profiles)
- **Social Engagement** (Follow Other Users, Activity Feed, Reflection Likes & Engagement)
- **Advanced Discovery** (Mood-Based Recommendations, Community Collections)

**Phase 1 Exclusions:**
- Filtering journal entries by game, date range, or mood (pagination only)
- Searching journal entries
- Bulk operations (editing/deleting multiple entries)
- Exporting journal entries (PDF, text file, etc.)
- Photo/screenshot uploads to journal entries
- Automatic linking of journal entries to library items (manual selection only)
- Public visibility or sharing of journal entries (all entries are private in Phase 1)
- Editing journal entries from the timeline view (must navigate to detail page first)
- Advanced rich text features (tables, code blocks, links, images, etc.) beyond basic formatting

**Future Considerations:**
- Advanced rich text editing capabilities (tables, code blocks, links, images, etc.)
- Advanced filtering and search
- Entry templates or prompts
- Integration with playtime tracking from platforms
- Mobile-optimized journaling experience

