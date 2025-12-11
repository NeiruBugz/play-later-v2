"use client";

import DOMPurify from "dompurify";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { GameCard } from "@/shared/components/game-card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { formatRelativeDate } from "@/shared/lib/date";
import { JournalMood, type JournalEntryDomain } from "@/shared/types";

import { deleteJournalEntryAction } from "../server-actions/delete-journal-entry";
import { DeleteEntryDialog } from "./delete-entry-dialog";

interface GameInfo {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
}

interface JournalEntryDetailProps {
  entry: JournalEntryDomain;
  game: GameInfo;
}

const MOOD_LABELS: Record<JournalMood, string> = {
  [JournalMood.EXCITED]: "Excited",
  [JournalMood.RELAXED]: "Relaxed",
  [JournalMood.FRUSTRATED]: "Frustrated",
  [JournalMood.ACCOMPLISHED]: "Accomplished",
  [JournalMood.CURIOUS]: "Curious",
  [JournalMood.NOSTALGIC]: "Nostalgic",
};

export function JournalEntryDetail({ entry, game }: JournalEntryDetailProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const displayTitle = entry.title || "Untitled Entry";
  const isUpdated = entry.updatedAt.getTime() !== entry.createdAt.getTime();

  const sanitizedContent = useMemo(
    () => DOMPurify.sanitize(entry.content),
    [entry.content],
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    startTransition(async () => {
      try {
        const result = await deleteJournalEntryAction({ entryId: entry.id });

        if (result.success) {
          toast.success("Journal entry deleted", {
            description: "Your journal entry has been permanently deleted.",
          });
          router.push("/journal");
        } else {
          toast.error("Failed to delete entry", {
            description: result.error,
          });
          setIsDeleting(false);
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Please try again later.";
        toast.error("An unexpected error occurred", { description: errorMsg });
        setIsDeleting(false);
      }
    });
  };

  return (
    <div className="space-y-xl">
      {/* Entry Header */}
      <header className="space-y-md">
        <h1 className="heading-xl font-serif">{displayTitle}</h1>
        <div className="gap-md flex flex-wrap items-center">
          <time
            dateTime={entry.createdAt.toISOString()}
            className="text-muted-foreground body-sm"
          >
            Created {formatRelativeDate(entry.createdAt)}
          </time>
          {isUpdated && (
            <>
              <span className="text-muted-foreground">·</span>
              <time
                dateTime={entry.updatedAt.toISOString()}
                className="text-muted-foreground body-sm"
              >
                Updated {formatRelativeDate(entry.updatedAt)}
              </time>
            </>
          )}
        </div>
      </header>

      {/* Game Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Game</CardTitle>
        </CardHeader>
        <CardContent>
          <GameCard
            game={{
              id: game.id,
              name: game.title,
              slug: game.slug,
              coverImageId: game.coverImage,
            }}
            layout="horizontal"
            density="standard"
            size="md"
          />
        </CardContent>
      </Card>

      {/* Entry Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-lg">
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />

          {/* Entry Metadata */}
          {(entry.mood || entry.playSession !== null) && (
            <div className="gap-md pt-lg flex flex-wrap items-center border-t">
              {entry.mood && (
                <div className="space-y-xs">
                  <span className="text-muted-foreground text-xs">Mood</span>
                  <Badge variant="secondary">{MOOD_LABELS[entry.mood]}</Badge>
                </div>
              )}
              {entry.playSession !== null && (
                <div className="space-y-xs">
                  <span className="text-muted-foreground text-xs">
                    Hours Played
                  </span>
                  <Badge variant="outline">{entry.playSession} hours</Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="gap-md flex items-center justify-end">
        <Button asChild variant="outline">
          <Link href={`/journal/${entry.id}/edit`}>Edit</Link>
        </Button>
        <Button
          variant="destructive"
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={isDeleting || isPending}
        >
          {isDeleting || isPending ? "Deleting..." : "Delete"}
        </Button>
      </div>

      <DeleteEntryDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        entryTitle={entry.title}
      />
    </div>
  );
}
