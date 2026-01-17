"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { JournalEntryDomain } from "@/shared/types";

import { getPlayingGameAction } from "../server-actions/get-playing-game";
import { InlineGameSelector } from "./inline-game-selector";
import { JournalEntryForm } from "./journal-entry-form";

export function NewJournalEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameIdFromQuery = searchParams.get("gameId");
  const [selectedGameId, setSelectedGameId] = useState<string | null>(
    gameIdFromQuery
  );
  const [defaultPlayingGameId, setDefaultPlayingGameId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!gameIdFromQuery) {
      getPlayingGameAction()
        .then((result) => {
          if (result.success && result.data) {
            setDefaultPlayingGameId(result.data.id);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch playing game:", error);
        });
    }
  }, [gameIdFromQuery]);

  const handleSuccess = (entry: JournalEntryDomain) => {
    router.push(`/journal/${entry.id}`);
  };

  const handleCancel = () => {
    router.push("/journal");
  };

  const handleGameSelect = (gameId: string) => {
    setSelectedGameId(gameId || null);
  };

  return (
    <div className="space-y-xl">
      <header className="space-y-md">
        <div>
          <h1 className="heading-xl font-semibold">Write New Entry</h1>
          <p className="body-md text-muted-foreground">
            Share your thoughts and experiences
          </p>
        </div>
        <InlineGameSelector
          selectedGameId={selectedGameId}
          onGameSelect={handleGameSelect}
          defaultGameId={defaultPlayingGameId ?? undefined}
        />
      </header>
      {selectedGameId && (
        <JournalEntryForm
          gameId={selectedGameId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
