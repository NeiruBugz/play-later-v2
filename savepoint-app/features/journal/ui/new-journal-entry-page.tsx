"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import type { JournalEntryDomain } from "@/shared/types";

import { GameSelector } from "./game-selector";
import { JournalEntryForm } from "./journal-entry-form";

export function NewJournalEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameIdFromQuery = searchParams.get("gameId");
  const [selectedGameId, setSelectedGameId] = useState<string | null>(
    gameIdFromQuery
  );

  const handleSuccess = (entry: JournalEntryDomain) => {
    router.push(`/journal/${entry.id}`);
  };

  const handleCancel = () => {
    router.push("/journal");
  };

  const handleGameSelect = (gameId: string) => {
    setSelectedGameId(gameId);
  };

  if (!selectedGameId) {
    return (
      <div className="space-y-xl">
        <header>
          <h1 className="heading-xl font-serif">Write New Entry</h1>
          <p className="body-md text-muted-foreground">
            Select a game to write about
          </p>
        </header>
        <GameSelector onGameSelect={handleGameSelect} onCancel={handleCancel} />
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      <header>
        <h1 className="heading-xl font-serif">Write New Entry</h1>
        <p className="body-md text-muted-foreground">
          Share your thoughts and experiences
        </p>
      </header>
      <JournalEntryForm
        gameId={selectedGameId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
