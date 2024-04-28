"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GameStatus } from "@prisma/client";
import { CheckCheck, Ghost, Library, ListChecks, Play } from "lucide-react";
import { BsBookshelf } from "react-icons/bs";
import { useMediaQuery } from "usehooks-ts";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const isDesktop = useMediaQuery("(min-width: 768px)");
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

  if (isDesktop) {
    return (
      <RadioGroup
        defaultValue={searchParams?.get("status") ?? "BACKLOG"}
        value={searchParams?.get("status") ?? "BACKLOG"}
        className={cn(
          "group my-2 flex flex-row items-center justify-center rounded-md bg-muted p-1 text-muted-foreground disabled:cursor-not-allowed"
        )}
        onValueChange={onChange}
      >
        {Object.entries(statusMapping).map(([key, value]) => (
          <div key={key}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <RadioGroupItem
                      value={key}
                      id={value.radioValue}
                      className="group sr-only"
                      aria-label={`Navigate to ${value.tooltipValue}`}
                    />
                    <Label
                      htmlFor={value.radioValue}
                      className={cn(
                        "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3",
                        "py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none",
                        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                        "hover:ring-2 group-disabled:cursor-not-allowed group-disabled:hover:ring-0",
                        {
                          "bg-background text-foreground shadow-sm":
                            searchParams?.get("status") === key,
                        }
                      )}
                    >
                      <span className="mr-1">{value.icon}</span>
                      <span className="hidden md:block">{value.label}</span>
                      {counts?.[key] ? (
                        <span className="hidden md:block">
                          &nbsp;({counts?.[key]})
                        </span>
                      ) : null}
                    </Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="hidden rounded bg-black p-2 text-xs text-white">
                  {value.tooltipValue}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ))}
      </RadioGroup>
    );
  }

  return (
    <div className="flex w-full flex-wrap gap-2">
      {Object.entries(statusMapping).map(([key, value]) => (
        <Badge
          key={key}
          variant="outline"
          className={cn("h-8 text-[16px] font-normal", {
            "border-primary bg-primary font-medium text-primary-foreground":
              searchParams?.get("status") === value.radioValue,
          })}
          onClick={() => onChange(value.radioValue)}
        >
          {value.label}
        </Badge>
      ))}
    </div>
  );
}
