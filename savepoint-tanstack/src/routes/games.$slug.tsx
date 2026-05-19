import { Await, createFileRoute, Link } from "@tanstack/react-router";
import { Component, Suspense, type ReactNode } from "react";

import {
  RelatedGamesInfiniteList,
  RelatedGamesSkeleton,
} from "@/features/browse-related-games";
import {
  getGameDetailPageDataFn,
  type DeferredRelatedGames,
  type DeferredTimesToBeat,
  type RelatedCollectionSection,
} from "@/features/game-detail/api";
import {
  TimesToBeatSection,
  TimesToBeatSkeleton,
} from "@/features/game-detail/ui";
import { AppError } from "@/shared/lib/errors";
import { GameDetail } from "@/widgets/game-detail";

export const Route = createFileRoute("/games/$slug")({
  loader: ({ params }) =>
    getGameDetailPageDataFn({ data: { slug: params.slug } }),
  component: GameDetailRoute,
  errorComponent: GameDetailErrorBoundary,
});

function GameDetailRoute() {
  const { data, viewerUserId, deferredRelatedGames, deferredTimesToBeat } =
    Route.useLoaderData();

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
            <Await promise={deferredTimesToBeat}>
              {(timesToBeat: Awaited<DeferredTimesToBeat>) =>
                timesToBeat === null ? null : (
                  <TimesToBeatSection timesToBeat={timesToBeat} />
                )
              }
            </Await>
          </Suspense>
        </SectionErrorBoundary>
      }
      relatedGamesSlot={
        <SectionErrorBoundary
          fallback={
            <SectionErrorMessage
              headingId="related-games-heading"
              heading="Related games"
              message="Couldn't load related games"
            />
          }
        >
          <Suspense fallback={<RelatedGamesSkeleton />}>
            <Await promise={deferredRelatedGames}>
              {(sections: Awaited<DeferredRelatedGames>) =>
                sections.length === 0 ? null : (
                  <RelatedGamesSections sections={sections} />
                )
              }
            </Await>
          </Suspense>
        </SectionErrorBoundary>
      }
    />
  );
}

function RelatedGamesSections({
  sections,
}: {
  sections: RelatedCollectionSection[];
}) {
  return (
    <section
      aria-labelledby="related-games-heading"
      className="gap-md flex flex-col"
    >
      <h2 id="related-games-heading" className="text-h3">
        Related games
      </h2>
      <div className="gap-lg flex flex-col">
        {sections.map((section) => (
          <div key={section.collectionId} className="gap-md flex flex-col">
            <h3 className="text-h4">{section.collectionName}</h3>
            <RelatedGamesInfiniteList
              collectionId={section.collectionId}
              pageSize={section.pageSize}
              firstPage={section.firstPage}
            />
          </div>
        ))}
      </div>
    </section>
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

/**
 * Minimal class-based error boundary for per-section Suspense boundaries.
 * React still does not ship a built-in `<ErrorBoundary>`; this is the
 * standard 8-line implementation. Rejected promises bubble out of `<Await>`
 * and land here, while the surrounding page stays interactive.
 */
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
