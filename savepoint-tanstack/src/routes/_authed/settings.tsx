import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { useIsDesktop } from "@/shared/lib/use-media-query";
import { PageHeader } from "@/shared/ui";
import { SettingsList, SettingsRail } from "@/widgets/settings-rail";

export const Route = createFileRoute("/_authed/settings")({
  component: SettingsLayout,
});

// Settings shell — on phones: full-page grouped list (drill-in navigation);
// on desktop (md+): two-column rail + outlet side-by-side.
// Child routes (settings/profile, settings/account) own their own content.
function SettingsLayout() {
  const isDesktop = useIsDesktop();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeSegment: "profile" | "account" | undefined = pathname.endsWith(
    "/settings/profile"
  )
    ? "profile"
    : pathname.endsWith("/settings/account")
      ? "account"
      : undefined;

  const backLink = (
    <Link
      to="/profile"
      className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to profile
    </Link>
  );

  if (!isDesktop) {
    return (
      <main className="container mx-auto px-4 py-6">
        {backLink}
        <PageHeader eyebrow="// SETTINGS" title="Settings" />
        {activeSegment === undefined ? <SettingsList /> : <Outlet />}
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6">
      {backLink}
      <PageHeader eyebrow="// SETTINGS" title="Settings" />
      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <aside>
          <SettingsRail activeSegment={activeSegment} />
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
