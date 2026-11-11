import { useState } from "react";

import { formatAbsoluteDate, formatHours } from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { SectionLabel } from "@/shared/ui/section-label";

import type { AboutPanelProps } from "./about-panel.type";

const SECONDS_PER_MINUTE = 60;

type Fact = { term: string; value: string };

export function AboutPanel({
  summary,
  developer,
  releaseDate,
  timeToCreditsSeconds,
  timeToCompleteSeconds,
  themes,
  genres,
}: AboutPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const facts: Fact[] = [
    developer ? { term: "Developer", value: developer } : null,
    releaseDate
      ? {
          term: "Released",
          value: formatAbsoluteDate(releaseDate, { utc: true }),
        }
      : null,
    timeToCreditsSeconds !== null
      ? {
          term: "Main story",
          value: formatHours(timeToCreditsSeconds / SECONDS_PER_MINUTE),
        }
      : null,
    timeToCompleteSeconds !== null
      ? {
          term: "100%",
          value: formatHours(timeToCompleteSeconds / SECONDS_PER_MINUTE),
        }
      : null,
  ].filter((fact): fact is Fact => fact !== null);
  const tags = [...themes, ...genres];

  return (
    <>
      <SectionLabel>About</SectionLabel>

      {summary ? (
        <div className="flex flex-col items-start gap-1">
          <p
            aria-label="Game summary"
            className={cn(
              "max-w-[720px] text-base text-foreground/85",
              !isExpanded && "line-clamp-4"
            )}
          >
            {summary}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            {isExpanded ? "Less" : "More"}
          </Button>
        </div>
      ) : null}

      {facts.length > 0 ? (
        <dl className="flex flex-col gap-1 text-base md:text-sm">
          {facts.map((fact) => (
            <div key={fact.term} className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">
                {fact.term}
              </dt>
              <dd className="text-foreground">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {tags.length > 0 ? (
        <ul aria-label="Themes and genres" className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
