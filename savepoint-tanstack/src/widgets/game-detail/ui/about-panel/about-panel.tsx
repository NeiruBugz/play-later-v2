import { SectionLabel } from "@/shared/ui/section-label";

import type { AboutPanelProps } from "./about-panel.type";

type Fact = { term: string; value: string };

export function AboutPanel({
  summary,
  releaseYear,
  developer,
  publisher,
}: AboutPanelProps) {
  const facts: Fact[] = [
    releaseYear ? { term: "Release year", value: releaseYear } : null,
    developer ? { term: "Developer", value: developer } : null,
    publisher ? { term: "Publisher", value: publisher } : null,
  ].filter((f): f is Fact => f !== null);

  if (!summary && facts.length === 0) {
    return null;
  }

  return (
    <>
      {summary ? (
        <p
          aria-label="Game summary"
          className="text-foreground/85 max-w-[720px] text-base"
        >
          {summary}
        </p>
      ) : null}

      {facts.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[max-content_1fr] md:items-baseline">
          <SectionLabel>About</SectionLabel>
          <dl className="text-sm">
            {facts.map((fact) => (
              <div key={fact.term} className="flex gap-2">
                <dt className="text-muted-foreground w-24">{fact.term}</dt>
                <dd className="text-foreground">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </>
  );
}
