import { createFileRoute } from "@tanstack/react-router";

import { getUpcomingReleasesFn } from "@/features/upcoming-releases";
import { UpcomingReleasesPage } from "@/widgets/upcoming-releases-page";

export const Route = createFileRoute("/_authed/upcoming")({
  loader: () => getUpcomingReleasesFn(),
  component: UpcomingRoute,
});

function UpcomingRoute() {
  const { entries } = Route.useLoaderData();
  return <UpcomingReleasesPage entries={entries} />;
}
