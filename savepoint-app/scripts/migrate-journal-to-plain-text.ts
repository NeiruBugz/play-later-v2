import { prisma } from "@/shared/lib/app/db";
import { stripHtmlTags } from "@/shared/lib/rich-text";

async function migrateJournalEntriesToPlainText(): Promise<void> {
  console.log("Starting journal entry migration to plain text...");

  const entries = await prisma.journalEntry.findMany({
    select: { id: true, content: true },
  });

  console.log(`Found ${entries.length} total entries`);

  let migrated = 0;
  let skipped = 0;

  for (const entry of entries) {
    // Skip if already plain text (no HTML tags)
    if (!entry.content.includes("<")) {
      skipped++;
      continue;
    }

    const plainText = stripHtmlTags(entry.content);

    await prisma.journalEntry.update({
      where: { id: entry.id },
      data: { content: plainText },
    });
    migrated++;
  }

  console.log(`Migration complete!`);
  console.log(`- Migrated: ${migrated} entries`);
  console.log(`- Skipped (already plain text): ${skipped} entries`);
}

migrateJournalEntriesToPlainText()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
