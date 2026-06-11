import { Link } from "@tanstack/react-router";

import type { ProfilePlaythroughsSectionProps } from "./profile-playthroughs-section.type";

export function ProfilePlaythroughsSection({
  playthroughs,
}: ProfilePlaythroughsSectionProps) {
  if (playthroughs.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-col gap-3">
      {playthroughs.map((run) => (
        <li key={run.id} className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Link
              to="/games/$slug"
              params={{ slug: run.game.slug }}
              className="font-medium hover:underline"
            >
              {run.game.title}
            </Link>
            {run.platform && (
              <span className="text-muted-foreground text-sm">
                {run.platform}
              </span>
            )}
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            {run.finishedAt ? (
              <span>{run.finishedAt.toLocaleDateString()}</span>
            ) : (
              <span>in progress</span>
            )}
            {run.rating !== null && (
              <span data-testid="run-rating">{run.rating}/10</span>
            )}
          </div>
          {run.notes && (
            <p className="text-muted-foreground text-sm">{run.notes}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
