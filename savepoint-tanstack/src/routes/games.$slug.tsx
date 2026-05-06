import { createFileRoute, Link } from "@tanstack/react-router";

import { getGameDetailPageDataFn } from "@/features/game-detail/api";
import { AppError } from "@/shared/lib/errors";
import { GameDetail } from "@/widgets/game-detail";

export const Route = createFileRoute("/games/$slug")({
  loader: ({ params }) =>
    getGameDetailPageDataFn({ data: { slug: params.slug } }),
  component: GameDetailRoute,
  errorComponent: GameDetailErrorBoundary,
});

function GameDetailRoute() {
  const { data, viewerUserId } = Route.useLoaderData();

  return <GameDetail data={data} viewerUserId={viewerUserId} />;
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
