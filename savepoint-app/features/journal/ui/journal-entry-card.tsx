import Link from "next/link";

import { GameCardCover } from "@/widgets/game-card";
import type { JournalEntryDomain } from "@/features/journal/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/shared/components/ui/card";
import { formatRelativeDate } from "@/shared/lib/date";
import { stripHtmlTags } from "@/shared/lib/rich-text";
import { cn } from "@/shared/lib/ui/utils";

import { MOOD_LABELS } from "../lib/mood-labels";

interface GameInfo {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
}

interface JournalEntryCardProps {
  entry: JournalEntryDomain;
  game: GameInfo;
  hideGameMetadata?: boolean;
}

function getContentPreview(content: string, maxLength: number = 100): string {
  const plainText = stripHtmlTags(content);
  if (plainText.length <= maxLength) {
    return plainText;
  }
  return `${plainText.slice(0, maxLength)}...`;
}

function formatPlaytime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

function sanitizeTag(tag: string): string {
  return tag.replace(/^#+/, "");
}

function QuickEntryCard({
  entry,
  game,
  hideGameMetadata,
}: JournalEntryCardProps) {
  const plainNote = entry.content ? stripHtmlTags(entry.content).trim() : "";
  const hasPlaytime =
    entry.playedMinutes !== null && entry.playedMinutes !== undefined;
  const hasTags = entry.tags.length > 0;

  return (
    <Link href={`/journal/${entry.id}`} className="group block">
      <Card
        className={cn(
          "cursor-pointer transition-colors",
          "hover:border-primary/40"
        )}
      >
        <CardContent className="p-md gap-md flex items-center">
          {!hideGameMetadata && game.coverImage && (
            <GameCardCover
              imageId={game.coverImage}
              gameTitle={game.title}
              size="cover_small"
              aspectRatio="portrait"
              className="h-12 w-9 flex-shrink-0"
              enableHoverEffect={false}
            />
          )}
          <div className="min-w-0 flex-1">
            {entry.mood && (
              <p className="text-caption text-primary/70 mb-0.5 tracking-widest uppercase">
                {MOOD_LABELS[entry.mood]}
              </p>
            )}
            <div className="flex items-baseline gap-2">
              {!hideGameMetadata && (
                <span className="text-caption truncate font-medium">
                  {game.title}
                </span>
              )}
              {hasPlaytime && (
                <span className="text-caption text-muted-foreground tabular-nums">
                  {hideGameMetadata ? "" : "· "}
                  {formatPlaytime(entry.playedMinutes!)}
                </span>
              )}
              <span className="text-caption text-muted-foreground ml-auto flex-shrink-0">
                {formatRelativeDate(entry.updatedAt)}
              </span>
            </div>
            {plainNote && (
              <p className="text-caption text-muted-foreground mt-1 line-clamp-1">
                {plainNote}
              </p>
            )}
            {hasTags && (
              <div className="mt-2 flex flex-wrap gap-1">
                {entry.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-caption border-border text-muted-foreground rounded border bg-transparent px-2 py-0.5"
                  >
                    {sanitizeTag(tag)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function JournalEntryCard({
  entry,
  game,
  hideGameMetadata,
}: JournalEntryCardProps) {
  if (entry.kind === "QUICK") {
    return (
      <QuickEntryCard
        entry={entry}
        game={game}
        hideGameMetadata={hideGameMetadata}
      />
    );
  }

  const displayTitle = entry.title || "Untitled Entry";
  const contentPreview = getContentPreview(entry.content, 100);
  const hasTags = entry.tags.length > 0;

  return (
    <Link href={`/journal/${entry.id}`} className="block">
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="p-lg">
          <div className="gap-lg flex">
            {!hideGameMetadata && game.coverImage && (
              <div className="flex-shrink-0">
                <GameCardCover
                  imageId={game.coverImage}
                  gameTitle={game.title}
                  size="cover_small"
                  aspectRatio="portrait"
                  className="h-20 w-14"
                  enableHoverEffect={false}
                />
              </div>
            )}

            <div className="space-y-md min-w-0 flex-1">
              <div className="space-y-xs">
                {entry.mood && (
                  <p className="text-caption text-primary/70 tracking-widest uppercase">
                    {MOOD_LABELS[entry.mood]}
                  </p>
                )}
                <CardTitle className="line-clamp-1 text-base">
                  {displayTitle}
                </CardTitle>
                <CardDescription className="text-caption">
                  {formatRelativeDate(entry.updatedAt)}
                </CardDescription>
              </div>

              <p className="text-body text-muted-foreground line-clamp-2">
                {contentPreview}
              </p>

              {!hideGameMetadata && (
                <p className="text-caption truncate font-medium">
                  {game.title}
                </p>
              )}

              {hasTags && (
                <div className="flex flex-wrap gap-1">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-caption border-border text-muted-foreground rounded border bg-transparent px-2 py-0.5"
                    >
                      {sanitizeTag(tag)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
