import { createFileRoute } from "@tanstack/react-router";

import { getDashboardPageDataFn } from "@/features/dashboard";
import { DashboardPage } from "@/widgets/dashboard-page";

export const Route = createFileRoute("/_authed/dashboard")({
  loader: () => getDashboardPageDataFn(),
  component: RouteComponent,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <DashboardPage data={data} />;
}
