"use client";

import { useRouter } from "next/navigation";

import type { JournalEntryDomain } from "@/features/journal/types";

import { JournalEntryForm } from "./journal-entry-form";

interface EditJournalEntryPageProps {
  entry: JournalEntryDomain;
}

export function EditJournalEntryPage({ entry }: EditJournalEntryPageProps) {
  const router = useRouter();

  const handleSuccess = () => {
    router.push(`/journal/${entry.id}`);
  };

  const handleCancel = () => {
    router.push(`/journal/${entry.id}`);
  };

  // Game-less entries are not editable in the current UI (UI exposes only
  // game-tied entries in MVP; the schema supports nulls for future use).
  if (entry.gameId === null) {
    return (
      <main className="py-3xl container mx-auto">
        <div className="mx-auto max-w-3xl">
          <p className="text-muted-foreground">
            This entry is not tied to a game and cannot be edited here.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="py-3xl container mx-auto">
      <div className="mx-auto max-w-3xl">
        <h1 className="heading-xl mb-xl font-semibold">Edit Journal Entry</h1>
        <JournalEntryForm
          entry={entry}
          gameId={entry.gameId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </main>
  );
}
