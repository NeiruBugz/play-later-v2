import type { GameMetadataProps } from "./game-metadata.type";

// Mirrors canonical's `formatAbsoluteDate` from `savepoint-app/shared/lib/date.ts`
// so the rendered string is byte-identical to the canonical app
// ("Mon DD, YYYY" — e.g. "May 7, 2026"). Inlined here rather than added to
// `shared/lib/` because no other tanstack surface formats dates yet.
const ABSOLUTE_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

/**
 * Display-only game metadata block: title (h1), optional release date,
 * optional summary. Pure presentation — no library state, no actions.
 */
export function GameMetadata({
  title,
  releaseDate,
  summary,
}: GameMetadataProps) {
  return (
    <div className="gap-sm flex flex-col">
      <h1 className="text-h1">{title}</h1>
      {releaseDate ? (
        <time
          dateTime={releaseDate.toISOString()}
          className="text-caption text-muted-foreground"
        >
          {ABSOLUTE_DATE_FORMATTER.format(releaseDate)}
        </time>
      ) : null}
      {summary ? (
        <p className="text-body text-foreground/85 max-w-[720px] leading-relaxed">
          {summary}
        </p>
      ) : null}
    </div>
  );
}
