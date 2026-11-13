import { Link } from "@tanstack/react-router";

import {
  formatComingSoonWhen,
  selectComingSoon,
  toStoredDay,
  type ComingSoonCandidate,
} from "@/entities/game";
import { useDeviceToday } from "@/shared/lib/hooks/use-device-today";
import { GameCover } from "@/shared/ui/game-cover";
import { SectionLabel } from "@/shared/ui/section-label";

import type { ComingSoonProps } from "./coming-soon.type";

function ComingSoonEntry({
  candidate,
  today,
}: {
  candidate: ComingSoonCandidate;
  today: string;
}) {
  const { game } = candidate;

  return (
    <li>
      <Link
        to="/games/$slug"
        params={{ slug: game.slug }}
        className="group flex min-h-11 items-center gap-3 py-1"
      >
        <GameCover
          src={game.coverImage}
          name={game.coverImage ? game.title : ""}
          size="xs"
        />
        <span className="min-w-0 flex-1 truncate text-sm font-medium group-hover:underline">
          {game.title}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {formatComingSoonWhen(toStoredDay(game.releaseDate), today)}
        </span>
      </Link>
    </li>
  );
}

export function ComingSoon({ candidates }: ComingSoonProps) {
  const today = useDeviceToday();
  const entries = selectComingSoon(candidates, today);
  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="home-coming-soon-heading" className="mb-4">
      <SectionLabel id="home-coming-soon-heading" className="mb-1">
        Coming soon
      </SectionLabel>
      <ul>
        {entries.map((candidate) => (
          <ComingSoonEntry
            key={candidate.id}
            candidate={candidate}
            today={today}
          />
        ))}
      </ul>
      <Link
        to="/upcoming"
        className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        See all upcoming
      </Link>
    </section>
  );
}
