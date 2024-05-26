"use client";

import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/packages/utils";
import { GameStatus } from "@prisma/client";
import { CheckCheck, Ghost, Library, ListChecks, Play } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BsBookshelf } from "react-icons/bs";

const statusMapping = {
  [GameStatus.BACKLOG]: {
    icon: <Library className="md:size-4" />,
    label: "Backlog",
    radioValue: "BACKLOG",
    tooltipValue: "Backlogged games",
  },
  [GameStatus.INPROGRESS]: {
    icon: <Play className="md:size-4" />,
    label: "Playing",
    radioValue: "INPROGRESS",
    tooltipValue: "Playing",
  },
  // eslint-disable-next-line perfectionist/sort-objects
  [GameStatus.COMPLETED]: {
    icon: <ListChecks className="md:size-4" />,
    label: "Completed",
    radioValue: "COMPLETED",
    tooltipValue: "Completed games",
  },
  [GameStatus.FULL_COMPLETION]: {
    icon: <CheckCheck className="md:size-4" />,
    label: "100% Completed",
    radioValue: "FULL_COMPLETION",
    tooltipValue: "100% completed completed games",
  },
  // eslint-disable-next-line perfectionist/sort-objects
  [GameStatus.ABANDONED]: {
    icon: <Ghost className="md:size-4" />,
    label: "Abandoned",
    radioValue: "ABANDONED",
    tooltipValue: "Abandoned games",
  },
  [GameStatus.SHELVED]: {
    icon: <BsBookshelf className="md:size-4" />,
    label: "Shelved",
    radioValue: "SHELVED",
    tooltipValue: "Shelved games",
  },
};

export function LibraryNavigation({
  counts,
}: {
  counts?: Record<string, number>;
}) {
  const searchParams = useSearchParams();

  return (
    <div className="flex w-fit flex-wrap gap-2">
      <Link href={`/library`}>
        <Badge
          className={cn(
            "h-8 cursor-pointer text-[16px] font-normal hover:bg-accent hover:text-accent-foreground",
            {
              "border-primary bg-primary font-medium text-primary-foreground":
                searchParams?.get("status") === null,
            }
          )}
          variant="outline"
        >
          All
        </Badge>
      </Link>
      {Object.entries(statusMapping).map(([key, value]) => (
        <Link href={`/library/?status=${key}`} key={key} prefetch>
          <Badge
            className={cn(
              "h-8 cursor-pointer text-[16px] font-normal hover:bg-accent hover:text-accent-foreground",
              {
                "border-primary bg-primary font-medium text-primary-foreground":
                  searchParams?.get("status") === value.radioValue,
              }
            )}
            variant="outline"
          >
            {value.label}
            {counts?.[key] ? (
              <span className="hidden md:block">&nbsp;({counts?.[key]})</span>
            ) : null}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
