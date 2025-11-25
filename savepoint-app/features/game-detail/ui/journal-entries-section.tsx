import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import type {
  JournalEntriesSectionProps,
  JournalEntryCardProps,
} from "./journal-entries-section.types";

function formatEntryDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
function truncateToLines(text: string, maxLines: number): string {
  const lines = text.split("\n").slice(0, maxLines);
  const truncated = lines.join("\n");

  const hasMore =
    text.split("\n").length > maxLines || truncated.length < text.length;
  return hasMore ? `${truncated}...` : truncated;
}
function JournalEntryCard({ entry }: JournalEntryCardProps) {
  const contentPreview = truncateToLines(entry.content, 2);
  const displayTitle = entry.title || "Untitled Entry";
  return (
    <Link href={`/journal/${entry.id}`} className="block">
      <Card className="cursor-pointer">
        <CardHeader className="pb-lg">
          <CardTitle className="line-clamp-1">
            {displayTitle}
          </CardTitle>
          <CardDescription className="caption">
            {formatEntryDate(entry.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="body-sm text-muted-foreground line-clamp-2">
            {contentPreview}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-xl rounded-lg border border-dashed p-3xl text-center">
      <p className="body-sm text-muted-foreground">No journal entries yet</p>
      <Button variant="secondary" size="sm" disabled>
        Write Your First Entry
      </Button>
    </div>
  );
}
export function JournalEntriesSection({
  journalEntries,
}: JournalEntriesSectionProps) {
  const hasEntries = journalEntries.length > 0;
  return (
    <div className="space-y-xl">
      <div className="flex items-center justify-between">
        <h2 className="heading-md">Journal Entries</h2>
        {hasEntries && (
          <Button variant="secondary" size="sm" disabled>
            Write New Entry
          </Button>
        )}
      </div>
      {hasEntries ? (
        <div className="space-y-lg">
          {journalEntries.map((entry) => (
            <JournalEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
