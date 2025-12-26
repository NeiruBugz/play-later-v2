# Migration Scripts

This directory contains one-time migration scripts for data transformations and database maintenance.

## Available Scripts

### migrate-journal-to-plain-text.ts

Converts existing journal entries from HTML (rich text) to plain text.

**When to run:**
- After deploying the journal plain text feature
- Before removing rich text editor dependencies

**How to run:**
```bash
# From savepoint-app/ directory
npx tsx scripts/migrate-journal-to-plain-text.ts
```

**Characteristics:**
- Idempotent: Safe to run multiple times
- Non-destructive: Skips entries that are already plain text
- Preserves formatting: Converts HTML to readable plain text using `stripHtmlTags` utility
- Progress tracking: Shows count of migrated vs skipped entries

**Example output:**
```
Starting journal entry migration to plain text...
Found 150 total entries
Migration complete!
- Migrated: 42 entries
- Skipped (already plain text): 108 entries
```

## General Guidelines

1. Always test migrations on a development/staging database first
2. Back up production data before running migrations
3. Scripts should be idempotent (safe to run multiple times)
4. Include progress logging for visibility
5. Handle errors gracefully with clear error messages
