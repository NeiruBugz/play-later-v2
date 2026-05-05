import { createFileRoute, Outlet } from "@tanstack/react-router";

import { requireUserIdOrRedirectFn } from "@/entities/session/api/require-user-id-or-redirect";

export const Route = createFileRoute("/_authed")({
  beforeLoad: () => requireUserIdOrRedirectFn(),
  component: () => <Outlet />,
});
