import { PlatformBadges } from "@/entities/game";
import { Badge } from "@/shared/ui/badge";

import type { ThemesTagsPanelProps } from "./themes-tags-panel.type";

export function ThemesTagsPanel({
  themes,
  genres,
  platforms,
}: ThemesTagsPanelProps) {
  const hasThemes = themes.length > 0;
  const hasGenres = genres.length > 0;
  const hasPlatforms = platforms.length > 0;

  if (!hasThemes && !hasGenres && !hasPlatforms) {
    return null;
  }

  return (
    <div className="gap-lg grid grid-cols-1 md:grid-cols-[max-content_1fr] md:items-baseline">
      {hasThemes ? (
        <>
          <TerminalLabel>{`// THEMES`}</TerminalLabel>
          <ul aria-label="Themes" className="flex flex-wrap gap-1.5 text-sm">
            {themes.map((theme) => (
              <li key={theme}>
                <Badge variant="secondary" className="rounded-md">
                  {theme}
                </Badge>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {hasGenres ? (
        <>
          <TerminalLabel>{`// GENRES`}</TerminalLabel>
          <ul aria-label="Genres" className="flex flex-wrap gap-1.5 text-sm">
            {genres.map((genre) => (
              <li key={genre}>
                <Badge variant="secondary" className="rounded-md">
                  {genre}
                </Badge>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {hasPlatforms ? (
        <>
          <TerminalLabel>{`// PLATFORMS`}</TerminalLabel>
          <div aria-label="Platforms">
            <PlatformBadges platforms={platforms} />
          </div>
        </>
      ) : null}
    </div>
  );
}

function TerminalLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
      {children}
    </span>
  );
}
