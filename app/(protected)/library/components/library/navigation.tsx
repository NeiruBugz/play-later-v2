"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GameStatus } from "@prisma/client";
import { CheckCheck, Ghost, Library, ListChecks, Play } from "lucide-react";
import { BsBookshelf } from "react-icons/bs";

import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

const statusMapping = {
  [GameStatus.BACKLOG]: {
    icon: <Library className="md:size-4" />,
    radioValue: "BACKLOG",
    tooltipValue: "Backlogged games",
    label: "Backlog",
  },
  [GameStatus.INPROGRESS]: {
    icon: <Play className="md:size-4" />,
    radioValue: "INPROGRESS",
    tooltipValue: "Playing",
    label: "Playing",
  },
  [GameStatus.COMPLETED]: {
    icon: <ListChecks className="md:size-4" />,
    radioValue: "COMPLETED",
    tooltipValue: "Completed games",
    label: "Completed",
  },
  [GameStatus.FULL_COMPLETION]: {
    icon: <CheckCheck className="md:size-4" />,
    radioValue: "FULL_COMPLETION",
    tooltipValue: "100% completed completed games",
    label: "100% Completed",
  },
  [GameStatus.ABANDONED]: {
    icon: <Ghost className="md:size-4" />,
    radioValue: "ABANDONED",
    tooltipValue: "Abandoned games",
    label: "Abandoned",
  },
  [GameStatus.SHELVED]: {
    icon: <BsBookshelf className="md:size-4" />,
    radioValue: "SHELVED",
    tooltipValue: "Shelved games",
    label: "Shelved",
  },
};

export function LibraryNavigation({
  counts,
}: {
  counts?: Record<string, number>;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const onChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams ?? new URLSearchParams());
      params.set("status", value);
      replace(`${pathname}?${params.toString()}`);
    },
    [pathname, replace, searchParams]
  );

  useEffect(() => {
    if (!searchParams?.get("status")) {
      onChange("BACKLOG");
    }
  }, [onChange, searchParams]);

  return (
    <div className="flex w-fit flex-wrap gap-2">
      {Object.entries(statusMapping).map(([key, value]) => (
        <Badge
          key={key}
          variant="outline"
          className={cn(
            "h-8 cursor-pointer text-[16px] font-normal hover:bg-accent hover:text-accent-foreground",
            {
              "border-primary bg-primary font-medium text-primary-foreground":
                searchParams?.get("status") === value.radioValue,
            }
          )}
          onClick={() => onChange(value.radioValue)}
        >
          {value.label}
          {counts?.[key] ? (
            <span className="hidden md:block">&nbsp;({counts?.[key]})</span>
          ) : null}
        </Badge>
      ))}
    </div>
  );
}
