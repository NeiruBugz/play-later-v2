"use client";

import { useRouter } from "next/navigation";

import type { JournalEntryDomain } from "@/shared/types";

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

  return (
    <main className="py-3xl container mx-auto">
      <div className="mx-auto max-w-3xl">
        <h1 className="heading-xl mb-xl font-serif">Edit Journal Entry</h1>
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
