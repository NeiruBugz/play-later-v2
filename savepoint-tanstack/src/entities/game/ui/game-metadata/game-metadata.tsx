import type { GameMetadataProps } from "./game-metadata.type";

const ABSOLUTE_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

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
