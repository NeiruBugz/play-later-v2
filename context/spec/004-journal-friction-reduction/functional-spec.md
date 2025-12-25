# Functional Specification: Journal Friction Reduction

- **Roadmap Item:** Reduce friction for capturing gaming thoughts and memories
- **Status:** Draft
- **Author:** Claude (AI Assistant)

---

## 1. Overview and Rationale (The "Why")

### Context

SavePoint's journal feature enables users to write reflections and memories about their gaming experiences. The product definition emphasizes journaling "during or after play sessions" to capture what resonated and why.

### Problem

The current journal UX creates friction that prevents quick thought capture:

- **Required title:** Forces users to name their thought before writing it—an unnatural flow that adds cognitive load
- **Rich text editor:** Signals formality ("this should be polished") which discourages quick, raw thoughts
- **"Create Entry" framing:** Feels like creating a document, not jotting down a thought

The irony: a journal meant to preserve gaming memories might prevent memories from being captured at all. A journal that feels like homework won't get used.

### Desired Outcome

Lower the barrier to capturing thoughts so dramatically that users can save a gaming moment in under 10 seconds. The timeline fills with memories because capturing is frictionless.

### Success Metrics

- Users can capture a thought in under 10 seconds
- Increased journal entry creation rate
- More short-form entries (indicating lower friction)
- Timeline fills with memories rather than remaining empty

---

## 2. Functional Requirements (The "What")

### 2.1 Title Field

Title becomes optional with automatic generation when left blank.

**Acceptance Criteria:**

- [ ] Title field is visible in the journal form
- [ ] Title field is not marked as required
- [ ] Form submits successfully when title is empty
- [ ] When title is empty, system auto-generates: formatted date (e.g., "Dec 25, 2024")
- [ ] Auto-generated titles use the user's local date at time of creation
- [ ] Users can edit auto-generated titles after creation

### 2.2 Content Field

Replace rich text editor with plain text textarea.

**Acceptance Criteria:**

- [ ] Journal content input is a plain textarea (no formatting toolbar)
- [ ] No bold, italic, links, lists, or other rich text formatting available
- [ ] Content preserves line breaks entered by user
- [ ] No minimum character or word requirement—single word entries are valid
- [ ] Placeholder text prompts naturally (e.g., "What's on your mind about [Game Name]?")

### 2.3 Form Framing

Reframe the UI language to feel lighter.

**Acceptance Criteria:**

- [ ] Primary submit button text is "Save thought" (not "Create Entry" or "Submit")
- [ ] Form header/prompt feels conversational (e.g., "What's on your mind about [Game Name]?")
- [ ] Overall form styling feels lightweight, not like a formal document editor

### 2.4 Hours Field

Hours played field remains optional (no change from current behavior).

**Acceptance Criteria:**

- [ ] Hours field remains in the form as optional input
- [ ] No changes to hours field validation or behavior

### 2.5 Mood Field

Mood selection is removed from this version.

**Acceptance Criteria:**

- [ ] Mood dropdown/selector is not displayed in the journal form
- [ ] Existing mood data on journal entries is preserved in the database
- [ ] Existing entries with mood still display their mood value when viewed

### 2.6 Data Migration

Existing journal entries with rich text formatting are converted to plain text.

**Acceptance Criteria:**

- [ ] Rich text HTML tags are stripped from existing content
- [ ] Line breaks and paragraph structure are preserved where possible
- [ ] No content is lost—text content remains intact
- [ ] Migration is idempotent (can be run multiple times safely)

### 2.7 Journal Display

Journal entries display with the simplified format.

**Acceptance Criteria:**

- [ ] Timeline view displays entries with title (or auto-generated date) and plain text content
- [ ] Auto-generated titles are visually indistinguishable from user-written titles
- [ ] Plain text content displays with preserved line breaks
- [ ] Existing entries (post-migration) display correctly

---

## 3. Scope and Boundaries

### In-Scope

- Title field: visible but optional, auto-generation when blank
- Content field: replace rich text editor with plain textarea
- Form framing: "Save thought" button, conversational prompts
- Data migration: convert existing rich text to plain text
- Display updates: timeline and entry views for plain text

### Out-of-Scope

- **Status Simplification (Decision 1):** Covered by separate specification
- **Optional Platform (Decision 2):** Covered by separate specification
- **Intentional Library Philosophy (Decision 4):** Covered by separate specification
- **Mood chips/selection:** Deferred to future version
- **Photo/screenshot uploads:** Listed as out-of-scope in product definition
- **Journal entry editing UX:** No changes to edit flow beyond content type change
- **Journal search/filtering:** No changes to discovery features
