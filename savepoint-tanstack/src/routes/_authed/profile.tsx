import { createFileRoute, redirect } from "@tanstack/react-router";

import { getProfilePageDataFn } from "@/features/profile-overview/api";

/**
 * `/profile` is the canonical-app shortcut to the signed-in user's public
 * profile. Per the visual-parity audit
 * (`context/audits/2026-05-18/visual-parity.md` — Profile / Routing) we
 * mirror the canonical model: server-redirect to `/u/$username` so that
 * the same surface is rendered whether a viewer hits `/profile` or arrives
 * via a public link.
 *
 * Query params are preserved so deep-links like `/profile?edit=true`
 * survive the bounce.
 */
export const Route = createFileRoute("/_authed/profile")({
  beforeLoad: async ({ search }) => {
    const { profile } = await getProfilePageDataFn();
    const username = profile.username;

    if (!username) {
      // Profile has no username yet — route to settings to finish setup.
      throw redirect({ to: "/settings/profile" });
    }

    throw redirect({
      to: "/u/$username",
      params: { username },
      search,
    });
  },
  // beforeLoad always throws — the component is never rendered.
  component: () => null,
});
