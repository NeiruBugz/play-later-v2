import { createFileRoute, Outlet } from "@tanstack/react-router";

import { requireUserIdFn } from "@/entities/session/api/require-user-id";

export const Route = createFileRoute("/_authed")({
  beforeLoad: () => requireUserIdFn(),
  component: AuthedLayout,
});

function AuthedLayout() {
  return <Outlet />;
}
