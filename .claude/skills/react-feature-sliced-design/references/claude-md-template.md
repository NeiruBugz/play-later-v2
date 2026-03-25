# CLAUDE.md for FSD Slices

Every slice must have a `CLAUDE.md`. It tells the agent what this module is for and anything non-obvious. Everything else — exports, types, file structure — is discoverable from code.

## Template

```markdown
# {Slice Name}

{1-2 sentences: what this module is for and why it exists.}

## Notes

{Non-obvious behaviors, gotchas, edge cases. Omit this section if there are none.}
```

## Examples

### Entity — simple, no gotchas

```markdown
# Customer

Customer domain model. Cards, avatars, status badges, and CRUD hooks for the customer entity.
```

### Feature — has non-obvious context

```markdown
# Search

Global search across all entity types. Used in the top navigation bar and command palette.

## Notes

- Debounces input by 300ms before querying
- Results are polymorphic — each entity type has its own result card renderer
```

### Widget — has dependencies worth noting

```markdown
# Project Finance Board

Financial overview for projects. Revenue/cost charts, deal timelines, position rates.

## Notes

- Revenue chart hidden for COST_PLUS pricing (shows empty state instead)
- Gated behind `useProjectRevenueChart` feature flag
```

## What NOT to include

Anything discoverable from code:

- File/directory listings
- Export listings (read `index.ts`)
- Prop types (read TypeScript)
- Internal hook/utility descriptions
- Import/dependency lists
- Usage examples
