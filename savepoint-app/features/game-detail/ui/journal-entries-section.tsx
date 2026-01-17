"use client";

import { PenLine } from "lucide-react";
import Link from "next/link";

import { useJournalEntryDialog } from "@/features/journal/hooks";
import { JournalEntryDialog } from "@/features/journal/ui/journal-entry-dialog";
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

function JournalEntryCard({
  entry,
  isLast,
}: JournalEntryCardProps & { isLast: boolean }) {
  const contentPreview = truncateToLines(entry.content, 2);
  const displayTitle = entry.title || "Untitled Entry";
  return (
    <div className="gap-lg relative flex">
      <div className="flex flex-col items-center">
        <div className="bg-primary z-10 h-3 w-3 rounded-full" />
        {!isLast && <div className="bg-border w-px flex-1" />}
      </div>
      <Link href={`/journal/${entry.id}`} className="mb-lg -mt-1 block flex-1">
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardHeader className="pb-sm">
            <CardTitle className="heading-xs line-clamp-1">
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
    </div>
  );
}

function EmptyState({ onWriteEntry }: { onWriteEntry: () => void }) {
  return (
    <div className="bg-muted/30 gap-lg p-2xl flex flex-col items-center rounded-lg border border-dashed text-center">
      <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
        <PenLine className="text-primary h-6 w-6" />
      </div>
      <div className="space-y-xs">
        <p className="body-md font-medium">Document your journey</p>
        <p className="body-sm text-muted-foreground">
          Capture thoughts, progress, and memories as you play
        </p>
      </div>
      <Button onClick={onWriteEntry}>Write Your First Entry</Button>
    </div>
  );
}

export function JournalEntriesSection({
  journalEntries,
  gameId,
  gameTitle,
}: JournalEntriesSectionProps) {
  const hasEntries = journalEntries.length > 0;
  const dialog = useJournalEntryDialog();

  return (
    <>
      <section
        className="animate-fade-in space-y-xl"
        aria-labelledby="journal-heading"
      >
        <div className="flex items-center justify-between">
          <h2 id="journal-heading" className="heading-md font-semibold">
            Your Journal
          </h2>
          {hasEntries && (
            <Button variant="secondary" size="sm" onClick={dialog.open}>
              <PenLine className="mr-2 h-4 w-4" />
              Write Entry
            </Button>
          )}
        </div>
        {hasEntries ? (
          <div className="pl-xs">
            {journalEntries.map((entry, index) => (
              <div
                key={entry.id}
                className="animate-stagger-in"
                style={{ animationDelay: `${(index + 1) * 50}ms` }}
              >
                <JournalEntryCard
                  entry={entry}
                  isLast={index === journalEntries.length - 1}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState onWriteEntry={dialog.open} />
        )}
      </section>

      <JournalEntryDialog
        isOpen={dialog.isOpen}
        onClose={dialog.close}
        gameId={gameId}
        gameTitle={gameTitle}
        onSuccess={dialog.onSuccess}
      />
    </>
  );
}
