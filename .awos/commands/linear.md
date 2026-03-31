---
description: Syncs AWOS specs and tasks to Linear as Projects and Issues.
---

# ROLE

You are a project management sync agent. Your job is to keep Linear in sync with the AWOS spec workflow. You read the local roadmap, specs, and task files, then create or update corresponding Linear Projects and Issues using the Linear MCP tools.

---

# TASK

Synchronize the AWOS spec/task structure to Linear. Each spec becomes a Linear Project. Each task slice becomes a Linear Issue under that Project.

---

# INPUTS & OUTPUTS

- **Roadmap:** `context/product/roadmap.md`
- **Specs:** `context/spec/[index]-[name]/functional-spec.md`
- **Tasks:** `context/spec/[index]-[name]/tasks.md`
- **Sync State:** `context/spec/[index]-[name]/linear-sync.json`
- **Linear Team:** Play Later

---

# PROCESS

### Step 1: Identify Specs to Sync

1. Read `context/product/roadmap.md`.
2. Find all **incomplete** (`- [ ]`) roadmap items that reference a spec number (e.g., `_(Spec 006)_`).
3. Also find **recently completed** (`- [x]`) items with specs that do NOT yet have a `linear-sync.json` (they were completed but never synced).
4. For each identified spec, read `context/spec/[index]-[name]/functional-spec.md` and `context/spec/[index]-[name]/tasks.md` (if it exists).
5. Read `context/spec/[index]-[name]/linear-sync.json` if it exists — this contains previously synced Linear IDs.

### Step 2: Sync Projects

For each spec identified in Step 1:

**If `linear-sync.json` does NOT exist (new sync):**
1. Create a Linear Project using `save_project`:
   - `name`: `"[index]: [Spec Title]"` (e.g., `"006: Code Health DX Round 2"`)
   - `addTeams`: `["Play Later"]`
   - `lead`: `"me"`
   - `summary`: First sentence of the spec's Overview section (max 255 chars)
   - `description`: The full Overview and Rationale section from the functional spec, as Markdown
   - `state`: Map spec status → Linear project state:
     - `Draft` / `In Review` → `planned`
     - `Approved` → `started`
     - `Completed` → `completed`
   - `priority`: `3` (Normal) for most; `2` (High) for the NEXT spec to be built
2. Save the project ID to `linear-sync.json`.

**If `linear-sync.json` EXISTS (update):**
1. Read the stored project ID.
2. Update the project using `save_project` with `id` parameter — sync name, summary, state, and description.

### Step 3: Sync Issues (Tasks)

For each spec that has a `tasks.md`:

1. Parse the task file. Each **Slice** (bold heading with `- [ ]` or `- [x]`) becomes a Linear Issue.
2. For each slice:

   **If not yet in `linear-sync.json`:**
   - Create an Issue using `save_issue`:
     - `title`: The slice name (e.g., `"Slice 1: Root CLAUDE.md + Documentation Foundation"`)
     - `team`: `"Play Later"`
     - `project`: The Linear Project ID from Step 2
     - `description`: The sub-tasks as a Markdown checklist
     - `state`: `"Done"` if all sub-tasks are `[x]`, `"Todo"` if all are `[ ]`, `"In Progress"` if mixed
     - `assignee`: `"me"`
     - `priority`: `2` (High) for the first incomplete slice, `3` (Normal) for others
   - Store the issue ID in `linear-sync.json` keyed by slice name.

   **If already in `linear-sync.json`:**
   - Update the existing issue: sync `state` based on current checkbox status, update `description` if sub-tasks changed.

### Step 4: Save Sync State

Write `linear-sync.json` for each spec directory with the structure:

```json
{
  "projectId": "linear-project-uuid",
  "projectUrl": "https://linear.app/play-later/project/...",
  "lastSynced": "2026-03-31T12:00:00Z",
  "issues": {
    "Slice 1: Root CLAUDE.md + Documentation Foundation": {
      "issueId": "PLA-123",
      "linearId": "uuid"
    }
  }
}
```

### Step 5: Report

After syncing, print a summary table:

```
| Spec | Linear Project | Issues | Status |
|------|---------------|--------|--------|
| 006  | Created       | 8 new  | Planned |
| 007  | Created       | 9 new  | Planned |
| ...  | ...           | ...    | ...     |
```

If any spec is missing `tasks.md`, note it: "Spec 008 has no tasks.md — project created but no issues. Run `/awos:tasks` to generate tasks."

---

# RULES

- **Never duplicate:** Always check `linear-sync.json` before creating. If IDs exist, update instead.
- **Preserve manual changes:** If an issue was manually updated in Linear (e.g., status changed to In Progress), do NOT overwrite it back to Todo. Only sync status from AWOS → Linear when the AWOS task checkbox state changes.
- **Completed specs:** If all tasks in a spec are `[x]`, set the Linear Project state to `completed`.
- **Idempotent:** Running this command multiple times should produce the same result.
