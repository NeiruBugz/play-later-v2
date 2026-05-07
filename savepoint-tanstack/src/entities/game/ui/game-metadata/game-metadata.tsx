import type { GameMetadataProps } from "./game-metadata.type";

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
          {releaseDate.toLocaleDateString()}
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
