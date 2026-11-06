import { PlatformBadges } from "@/entities/game";
import { Badge } from "@/shared/ui/badge";
import { SectionLabel } from "@/shared/ui/section-label";

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
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[max-content_1fr] md:items-baseline">
      {hasThemes ? (
        <>
          <SectionLabel>Themes</SectionLabel>
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
          <SectionLabel>Genres</SectionLabel>
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
          <SectionLabel>Platforms</SectionLabel>
          <div aria-label="Platforms">
            <PlatformBadges platforms={platforms} />
          </div>
        </>
      ) : null}
    </div>
  );
}
