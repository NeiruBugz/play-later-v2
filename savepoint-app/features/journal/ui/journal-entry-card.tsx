import Link from "next/link";

import { GameCardCover } from "@/shared/components/game-card/game-card-cover";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/shared/components/ui/card";
import { formatRelativeDate } from "@/shared/lib/date";
import { stripHtmlTags } from "@/shared/lib/rich-text";
import { JournalMood, type JournalEntryDomain } from "@/shared/types";

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
  [JournalMood.EXCITED]: "Excited",
  [JournalMood.RELAXED]: "Relaxed",
  [JournalMood.FRUSTRATED]: "Frustrated",
  [JournalMood.ACCOMPLISHED]: "Accomplished",
  [JournalMood.CURIOUS]: "Curious",
  [JournalMood.NOSTALGIC]: "Nostalgic",
};

/**
 * Gets first N characters of plain text content
 */
function getContentPreview(content: string, maxLength: number = 100): string {
  const plainText = stripHtmlTags(content);
  if (plainText.length <= maxLength) {
    return plainText;
  }
  return `${plainText.slice(0, maxLength)}...`;
}

export function JournalEntryCard({ entry, game }: JournalEntryCardProps) {
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
