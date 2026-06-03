import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Component, Suspense, type ReactNode } from "react";

import {
  RelatedGamesSkeleton,
  RelatedGamesTabs,
} from "@/features/browse-related-games";
import {
  getGameDetailPageDataFn,
  getRelatedGamesForGameFn,
  getTimesToBeatForGameFn,
  type RelatedCollectionSection,
} from "@/features/game-detail/api";
import {
  TimesToBeatSection,
  TimesToBeatSkeleton,
} from "@/features/game-detail/ui";
import { AppError } from "@/shared/lib/errors";
import { Card } from "@/shared/ui/card";
import { GameCard } from "@/widgets/game-card";
import { GameDetail } from "@/widgets/game-detail";

export const Route = createFileRoute("/games/$slug")({
  loader: ({ params }) =>
    getGameDetailPageDataFn({ data: { slug: params.slug } }),
  component: GameDetailRoute,
  errorComponent: GameDetailErrorBoundary,
});

function GameDetailRoute() {
  const { data, viewerUserId } = Route.useLoaderData();
  const igdbId = data.game.igdbId;

  return (
    <GameDetail
      data={data}
      viewerUserId={viewerUserId}
      timesToBeatSlot={
        <SectionErrorBoundary
          fallback={
            <SectionErrorMessage
              headingId="times-to-beat-heading"
              heading="Times to beat"
              message="Couldn't load times to beat"
            />
          }
        >
          <Suspense fallback={<TimesToBeatSkeleton />}>
            <TimesToBeatSlot
              igdbId={igdbId}
              playtimeTotalMinutes={data.playtimeTotalMinutes}
              journalCount={data.journalCount}
              recentSessionMinutes={data.recentSessionMinutes}
            />
          </Suspense>
        </SectionErrorBoundary>
      }
      relatedGamesSlot={
        <SectionErrorBoundary
          fallback={
            <Card variant="flat" className="gap-md p-xl flex flex-col">
              <SectionErrorMessage
                headingId="related-games-heading"
                heading="Related games"
                message="Couldn't load related games"
              />
            </Card>
          }
        >
          <Suspense
            fallback={
              <Card variant="flat" className="gap-md p-xl flex flex-col">
                <RelatedGamesSkeleton />
              </Card>
            }
          >
            <RelatedGamesSlot igdbId={igdbId} />
          </Suspense>
        </SectionErrorBoundary>
      }
    />
  );
}

function TimesToBeatSlot({
  igdbId,
  playtimeTotalMinutes,
  journalCount,
  recentSessionMinutes,
}: {
  igdbId: number;
  playtimeTotalMinutes: number;
  journalCount: number;
  recentSessionMinutes: number[];
}) {
  const { data: timesToBeat } = useSuspenseQuery({
    queryKey: ["times-to-beat", igdbId],
    queryFn: () => getTimesToBeatForGameFn({ data: { igdbId } }),
  });
  return (
    <TimesToBeatSection
      timesToBeat={timesToBeat}
      playtimeTotalMinutes={playtimeTotalMinutes}
      journalCount={journalCount}
      recentSessionMinutes={recentSessionMinutes}
    />
  );
}

function RelatedGamesSlot({ igdbId }: { igdbId: number }) {
  const { data: sections } = useSuspenseQuery({
    queryKey: ["related-games", igdbId],
    queryFn: () => getRelatedGamesForGameFn({ data: { igdbId } }),
  });
  if (sections.length === 0) return null;
  return <RelatedGamesSections sections={sections} />;
}

function RelatedGamesSections({
  sections,
}: {
  sections: RelatedCollectionSection[];
}) {
  return (
    <Card variant="flat" className="gap-md p-xl flex flex-col">
      <section
        aria-labelledby="related-games-heading"
        className="gap-md flex flex-col"
      >
        <h2 id="related-games-heading" className="text-h3">
          Related games
        </h2>
        <RelatedGamesTabs
          sections={sections}
          renderGame={(game) => (
            <GameCard
              game={{
                slug: game.slug,
                title: game.title,
                coverImageId: game.coverImageId,
              }}
              density="minimal"
            />
          )}
        />
      </section>
    </Card>
  );
}

function SectionErrorMessage({
  headingId,
  heading,
  message,
}: {
  headingId: string;
  heading: string;
  message: string;
}) {
  return (
    <section aria-labelledby={headingId} className="gap-md flex flex-col">
      <h2 id={headingId} className="text-h3">
        {heading}
      </h2>
      <div role="alert" className="text-destructive text-sm">
        {message}
      </div>
    </section>
  );
}

class SectionErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function GameDetailErrorBoundary({ error }: { error: Error }) {
  const isNotFound = error instanceof AppError && error.code === "NOT_FOUND";

  if (isNotFound) {
    return (
      <main
        role="alert"
        className="gap-md container mx-auto flex flex-col px-4 py-12"
      >
        <h1 className="text-h2">Game not found</h1>
        <p>We couldn't find a game matching this URL.</p>
        <p>
          <Link to="/" className="underline">
            Go home
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main
      role="alert"
      className="gap-md container mx-auto flex flex-col px-4 py-12"
    >
      <h1 className="text-h2">Something went wrong</h1>
      <p>An error occurred while loading this game. Please try again.</p>
      <p>
        <Link to="/" className="underline">
          Go home
        </Link>
      </p>
    </main>
  );
}
