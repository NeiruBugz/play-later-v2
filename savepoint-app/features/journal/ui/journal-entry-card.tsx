import Link from "next/link";

import { GameCardCover } from "@/widgets/game-card";
import type { JournalEntryDomain } from "@/features/journal/types";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/shared/components/ui/card";
import { formatRelativeDate } from "@/shared/lib/date";
import { stripHtmlTags } from "@/shared/lib/rich-text";
import { cn } from "@/shared/lib/ui/utils";
import { JournalMood } from "@/shared/types";

interface GameInfo {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
}

interface JournalEntryCardProps {
  entry: JournalEntryDomain;
  game: GameInfo;
}

const MOOD_LABELS: Record<JournalMood, string> = {
  [JournalMood.EXCITED]: "Hyped",
  [JournalMood.RELAXED]: "Chill",
  [JournalMood.FRUSTRATED]: "Fried",
  [JournalMood.ACCOMPLISHED]: "Proud",
  [JournalMood.CURIOUS]: "Curious",
  [JournalMood.NOSTALGIC]: "Nostalgic",
};

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

function QuickEntryCard({ entry, game }: JournalEntryCardProps) {
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
          {game.coverImage && (
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
            <div className="flex items-baseline gap-2">
              <span className="body-sm truncate font-medium">{game.title}</span>
              {hasPlaytime && (
                <span className="body-sm text-muted-foreground tabular-nums">
                  · {formatPlaytime(entry.playedMinutes!)}
                </span>
              )}
              <span className="body-sm text-muted-foreground ml-auto flex-shrink-0">
                {formatRelativeDate(entry.updatedAt)}
              </span>
            </div>
            {plainNote && (
              <p className="body-sm text-muted-foreground mt-1 line-clamp-1">
                {plainNote}
              </p>
            )}
            {(entry.mood || hasTags) && (
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {entry.mood && (
                  <Badge variant="secondary" className="text-xs">
                    {MOOD_LABELS[entry.mood]}
                  </Badge>
                )}
                {entry.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-muted-foreground text-xs"
                  >{`#${tag}`}</span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function JournalEntryCard({ entry, game }: JournalEntryCardProps) {
  if (entry.kind === "QUICK") {
    return <QuickEntryCard entry={entry} game={game} />;
  }

  const displayTitle = entry.title || "Untitled Entry";
  const contentPreview = getContentPreview(entry.content, 100);

  return (
    <Link href={`/journal/${entry.id}`} className="block">
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="p-lg">
          <div className="gap-lg flex">
            {/* Game Cover Image */}
            {game.coverImage && (
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

            {/* Entry Content */}
            <div className="space-y-md min-w-0 flex-1">
              {/* Header */}
              <div className="space-y-xs">
                <CardTitle className="line-clamp-1 text-base">
                  {displayTitle}
                </CardTitle>
                <CardDescription className="caption">
                  {formatRelativeDate(entry.updatedAt)}
                </CardDescription>
              </div>

              {/* Content Preview */}
              <p className="body-sm text-muted-foreground line-clamp-2">
                {contentPreview}
              </p>

              {/* Footer with Game Name and Mood */}
              <div className="gap-md flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="body-sm truncate font-medium">{game.title}</p>
                </div>
                {entry.mood && (
                  <Badge variant="secondary" className="flex-shrink-0">
                    {MOOD_LABELS[entry.mood]}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
