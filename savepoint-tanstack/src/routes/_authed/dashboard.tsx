import { createFileRoute } from "@tanstack/react-router";

import { getDashboardPageDataFn } from "@/features/dashboard";
import { useRefreshReleaseDates } from "@/features/release-dates/model";
import { DashboardPage } from "@/widgets/dashboard-page";

export const Route = createFileRoute("/_authed/dashboard")({
  loader: () => getDashboardPageDataFn(),
  component: RouteComponent,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  useRefreshReleaseDates();
  return <DashboardPage data={data} />;
}
