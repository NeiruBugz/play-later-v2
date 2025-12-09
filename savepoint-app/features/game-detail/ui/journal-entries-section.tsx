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
          <CardTitle className="line-clamp-1">{displayTitle}</CardTitle>
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
function EmptyState({ gameId }: { gameId?: string }) {
  const writeEntryHref = gameId
    ? `/journal/new?gameId=${gameId}`
    : "/journal/new";
  return (
    <div className="gap-xl p-3xl flex flex-col items-center rounded-lg border border-dashed text-center">
      <p className="body-sm text-muted-foreground">No journal entries yet</p>
      <Button variant="secondary" size="sm" asChild>
        <Link href={writeEntryHref}>Write Your First Entry</Link>
      </Button>
    </div>
  );
}
export function JournalEntriesSection({
  journalEntries,
  gameId,
}: JournalEntriesSectionProps) {
  const hasEntries = journalEntries.length > 0;
  const writeEntryHref = gameId
    ? `/journal/new?gameId=${gameId}`
    : "/journal/new";
  return (
    <section
      className="animate-fade-in space-y-xl"
      aria-labelledby="journal-heading"
    >
      <div className="flex items-center justify-between">
        <h2 id="journal-heading" className="heading-md font-serif">
          Journal Entries
        </h2>
        {hasEntries && (
          <Button variant="secondary" size="sm" asChild>
            <Link href={writeEntryHref}>Write New Entry</Link>
          </Button>
        )}
      </div>
      {hasEntries ? (
        <div className="space-y-lg">
          {journalEntries.map((entry, index) => (
            <div
              key={entry.id}
              className="animate-stagger-in"
              style={{ animationDelay: `${(index + 1) * 50}ms` }}
            >
              <JournalEntryCard entry={entry} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState gameId={gameId} />
      )}
    </section>
  );
}
