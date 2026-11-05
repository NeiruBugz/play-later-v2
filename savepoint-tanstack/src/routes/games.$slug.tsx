import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  notFound,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { Component, Suspense, type ReactNode } from "react";

import {
  RelatedGamesSkeleton,
  RelatedGamesTabs,
} from "@/features/browse-related-games";
import type { RelatedCollection } from "@/features/browse-related-games/api";
import { relatedGamesQueryOptions } from "@/features/browse-related-games/model";
import { getGameDetailPageDataFn } from "@/features/game-detail/api";
import { timesToBeatQueryOptions } from "@/features/game-detail/model";
import {
  TimesToBeatSection,
  TimesToBeatSkeleton,
} from "@/features/game-detail/ui";
import { AppError, NotFoundError } from "@/shared/lib/errors";
import { Card } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";
import { SectionLabel } from "@/shared/ui/section-label";
import { GameCard } from "@/widgets/game-card";
import { GameDetail } from "@/widgets/game-detail";

export const Route = createFileRoute("/games/$slug")({
  loader: async ({ params, context }) => {
    const view = await getGameDetailPageDataFn({
      data: { slug: params.slug },
    }).catch((error: unknown) => {
      if (error instanceof NotFoundError) throw notFound();
      throw error;
    });
    const { igdbId } = view.data.game;
    void context.queryClient.prefetchQuery(timesToBeatQueryOptions(igdbId));
    void context.queryClient.prefetchQuery(relatedGamesQueryOptions(igdbId));
    return view;
  },
  component: GameDetailRoute,
  errorComponent: GameDetailErrorBoundary,
  notFoundComponent: GameNotFound,
});

function GameDetailRoute() {
  const { data, viewerUserId } = Route.useLoaderData();
  const igdbId = data.game.igdbId;

  return (
    <GameDetail
      data={data}
      viewerUserId={viewerUserId}
      gameSlug={data.game.slug}
      timesToBeatSlot={
        <SectionErrorBoundary
          fallback={
            <Card variant="flat" className="flex flex-col gap-2 p-4">
              <SectionErrorMessage
                headingId="times-to-beat-heading"
                heading="Times to beat"
                message="Couldn't load times to beat"
              />
            </Card>
          }
        >
          <Suspense
            fallback={
              <Card variant="flat" className="flex flex-col gap-2 p-4">
                <TimesToBeatSkeleton />
              </Card>
            }
          >
            <TimesToBeatSlot igdbId={igdbId} />
          </Suspense>
        </SectionErrorBoundary>
      }
      relatedGamesSlot={
        <SectionErrorBoundary
          fallback={
            <Card variant="flat" className="flex flex-col gap-2 p-4">
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
              <Card variant="flat" className="flex flex-col gap-2 p-4">
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

function TimesToBeatSlot({ igdbId }: { igdbId: number }) {
  const { data: timesToBeat } = useSuspenseQuery(
    timesToBeatQueryOptions(igdbId)
  );
  return <TimesToBeatSection timesToBeat={timesToBeat} />;
}

function RelatedGamesSlot({ igdbId }: { igdbId: number }) {
  const { data: sections } = useSuspenseQuery(relatedGamesQueryOptions(igdbId));
  if (sections.length === 0) return null;
  return <RelatedGamesSections sections={sections} />;
}

function RelatedGamesSections({ sections }: { sections: RelatedCollection[] }) {
  return (
    <Card variant="flat" className="flex flex-col gap-2 p-4">
      <section
        aria-labelledby="related-games-heading"
        className="flex flex-col gap-2"
      >
        <SectionLabel id="related-games-heading">Related games</SectionLabel>
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
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <SectionLabel id={headingId}>{heading}</SectionLabel>
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

function GameNotFound() {
  return (
    <div
      role="alert"
      className="container mx-auto flex flex-col gap-2 px-4 py-12"
    >
      <PageHeader title="Game not found" className="mb-0" />
      <p>We couldn't find a game matching this URL.</p>
      <p>
        <Link to="/" className="underline">
          Go home
        </Link>
      </p>
    </div>
  );
}

function GameDetailErrorBoundary({ error }: ErrorComponentProps) {
  if (error instanceof AppError && error.code === "NOT_FOUND") {
    return <GameNotFound />;
  }

  return (
    <div
      role="alert"
      className="container mx-auto flex flex-col gap-2 px-4 py-12"
    >
      <PageHeader title="Something went wrong" className="mb-0" />
      <p>An error occurred while loading this game. Please try again.</p>
      <p>
        <Link to="/" className="underline">
          Go home
        </Link>
      </p>
    </div>
  );
}
