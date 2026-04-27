"use client";

import { PenLine, Plus } from "lucide-react";
import Link from "next/link";

import { useJournalEntryDialog } from "@/features/journal/hooks";
import { JournalEntryDialog } from "@/features/journal/ui/journal-entry-dialog";
import { Button } from "@/shared/components/ui/button";

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

function JournalTimelineEntry({
  entry,
  isLast,
}: JournalEntryCardProps & { isLast: boolean }) {
  const displayTitle = entry.title || "Untitled Entry";
  const snippet = entry.content?.trim() || "";
  const hasDuration = entry.playedMinutes && entry.playedMinutes > 0;
  const durationLabel = hasDuration
    ? entry.playedMinutes! < 60
      ? `${entry.playedMinutes} min`
      : `${(entry.playedMinutes! / 60).toFixed(1)} hrs`
    : null;

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className="bg-primary ring-background z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2" />
        {!isLast && <div className="bg-border mt-1 w-0.5 flex-1" />}
      </div>
      <Link
        href={`/journal/${entry.id}`}
        className="mb-6 block min-w-0 flex-1 pb-0.5 transition-opacity hover:opacity-80"
      >
        <p className="text-caption text-muted-foreground mb-1.5 font-mono">
          {formatEntryDate(entry.createdAt)}
        </p>
        <p className="text-body mb-1 leading-snug font-semibold">
          {displayTitle}
        </p>
        {snippet && (
          <p className="text-caption text-muted-foreground mb-1.5 line-clamp-2 leading-relaxed">
            {snippet}
          </p>
        )}
        {(durationLabel || entry.mood) && (
          <div className="text-caption text-muted-foreground flex items-center gap-2.5">
            {durationLabel && (
              <span className="flex items-center gap-1">
                <svg
                  viewBox="0 0 24 24"
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                {durationLabel}
              </span>
            )}
            {entry.mood && <span>Mood · {entry.mood.toLowerCase()}</span>}
          </div>
        )}
      </Link>
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
      <section id="journal" aria-labelledby="journal-heading">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="journal-heading" className="text-h2 whitespace-nowrap">
            Your Journal
          </h2>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" onClick={dialog.open}>
              <Plus className="mr-1 h-3.5 w-3.5" aria-hidden />
              Log session
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/journal/new?gameId=${gameId}`}>
                <PenLine className="mr-1 h-3.5 w-3.5" aria-hidden />
                Reflect
              </Link>
            </Button>
          </div>
        </div>

        {hasEntries ? (
          <div className="relative pl-[18px]">
            <div className="bg-border absolute top-1.5 bottom-1.5 left-1 w-0.5" />
            {journalEntries.map((entry, index) => (
              <JournalTimelineEntry
                key={entry.id}
                entry={entry}
                isLast={index === journalEntries.length - 1}
              />
            ))}
          </div>
        ) : (
          <p className="text-caption text-muted-foreground py-4">
            No entries yet — log your first session above.
          </p>
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
