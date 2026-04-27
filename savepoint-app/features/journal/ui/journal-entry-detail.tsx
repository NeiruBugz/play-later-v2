"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { JournalEntryDomain } from "@/features/journal/types";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { formatAbsoluteDate } from "@/shared/lib/date";

import { deriveEntryTitle } from "../lib/derive-entry-title";
import { MOOD_LABELS } from "../lib/mood-labels";
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

function formatPlaytime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export function JournalEntryDetail({ entry, game }: JournalEntryDetailProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const displayTitle = deriveEntryTitle(
    { title: entry.title, body: entry.content, createdAt: entry.createdAt },
    { title: game.title }
  );

  const hasPlaytime =
    entry.playedMinutes !== null && entry.playedMinutes !== undefined;

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
    <article className="space-y-xl mx-auto max-w-prose">
      {/* Mood eyebrow */}
      {entry.mood && (
        <p className="text-caption text-primary/70 tracking-widest uppercase">
          {MOOD_LABELS[entry.mood]}
        </p>
      )}

      {/* Title row */}
      <div className="gap-md flex items-start justify-between">
        <h1 className="text-h1">{displayTitle}</h1>

        <div className="gap-sm flex shrink-0 items-center">
          <Button asChild size="sm">
            <Link href={`/journal/${entry.id}/edit`}>Edit</Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="More actions"
                disabled={isDeleting || isPending}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setIsDeleteDialogOpen(true)}
              >
                Delete entry
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Metadata line */}
      <p className="text-caption text-muted-foreground">
        <Link
          href={`/games/${game.slug}`}
          className="hover:text-foreground transition-colors"
        >
          {game.title}
        </Link>
        {hasPlaytime && <span> · {formatPlaytime(entry.playedMinutes!)}</span>}
        <span> · </span>
        <time dateTime={entry.createdAt.toISOString()}>
          {formatAbsoluteDate(entry.createdAt)}
        </time>
      </p>

      {/* Body */}
      <p className="text-body whitespace-pre-wrap">{entry.content}</p>

      <DeleteEntryDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        entryTitle={displayTitle}
      />
    </article>
  );
}
