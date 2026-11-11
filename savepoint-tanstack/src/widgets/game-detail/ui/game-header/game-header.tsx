import { Link, useCanGoBack, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { formatEvenings } from "@/shared/lib/evenings";
import { CoverTint } from "@/shared/ui/cover-tint";
import { GameCover } from "@/shared/ui/game-cover";

import { formatPlatformFact } from "./format-platform-fact";
import type { GameHeaderProps } from "./game-header.type";

const PLATFORM_LIMIT = 3;
const IDENTITY_SEPARATOR = " · ";
const BACK_CLASS_NAME =
  "inline-flex h-11 items-center gap-1.5 text-sm font-medium text-[var(--tint-ink)] transition-opacity hover:opacity-70";

function BackLink() {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  const content = (
    <>
      <ArrowLeft size={18} aria-hidden="true" />
      Back
    </>
  );

  if (canGoBack) {
    return (
      <button
        type="button"
        onClick={() => router.history.back()}
        className={BACK_CLASS_NAME}
      >
        {content}
      </button>
    );
  }

  return (
    <Link to="/library" className={BACK_CLASS_NAME}>
      {content}
    </Link>
  );
}

function KeyFact({ label, value }: { label: string; value: string | null }) {
  if (value === null) {
    return null;
  }
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold text-[var(--tint-ink)]">{value}</dd>
    </div>
  );
}

export function GameHeader({ data, eveningMinutes }: GameHeaderProps) {
  const { game, igdbDetails, timeToCreditsSeconds, coverTint } = data;

  const releaseYear = igdbDetails.first_release_date
    ? new Date(igdbDetails.first_release_date * 1000)
        .getUTCFullYear()
        .toString()
    : (game.releaseDate?.getUTCFullYear().toString() ?? null);
  const developer =
    igdbDetails.involved_companies?.find((c) => c.developer)?.company.name ??
    null;
  const firstGenre = igdbDetails.genres?.[0]?.name ?? null;
  const identityLine = [releaseYear, developer, firstGenre]
    .filter((part): part is string => Boolean(part))
    .join(IDENTITY_SEPARATOR);

  const criticScore = igdbDetails.aggregated_rating;
  const platformNames = igdbDetails.platforms?.map((p) => p.name) ?? [];

  const facts = [
    {
      label: "Length",
      value: formatEvenings(timeToCreditsSeconds, eveningMinutes),
    },
    {
      label: "Critics",
      value: criticScore ? String(Math.round(criticScore)) : null,
    },
    { label: "On", value: formatPlatformFact(platformNames, PLATFORM_LIMIT) },
  ];

  return (
    <CoverTint tint={coverTint} variant="header" className="px-6 pb-8 md:px-12">
      <div className="pt-3">
        <BackLink />
      </div>
      <div className="mt-3 grid grid-cols-1 items-end gap-6 md:grid-cols-[200px_1fr]">
        <GameCover src={game.coverImage} name={game.title} size="lg" priority />
        <div className="flex min-w-0 flex-col gap-3">
          <div className="min-w-0">
            {identityLine ? (
              <p className="mb-1.5 text-xs font-medium text-[var(--tint-ink)]">
                {identityLine}
              </p>
            ) : null}
            <h1 className="font-display text-3xl leading-tight font-semibold md:text-4xl">
              {game.title}
            </h1>
          </div>
          <dl className="flex flex-wrap gap-x-8 gap-y-3">
            {facts.map((fact) => (
              <KeyFact key={fact.label} {...fact} />
            ))}
          </dl>
        </div>
      </div>
    </CoverTint>
  );
}
