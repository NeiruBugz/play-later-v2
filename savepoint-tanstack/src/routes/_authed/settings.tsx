import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { SettingsRail } from "@/widgets/settings-rail";

export const Route = createFileRoute("/_authed/settings")({
  component: SettingsLayout,
});

// Settings shell — vertical nav rail at md+, stacked above content at <md.
// Mounted via file-routing convention. Child routes (settings/profile,
// settings/account) render in the <Outlet/>; they no longer carry their
// own back-link / chrome.
function SettingsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeSegment: "profile" | "account" | undefined = pathname.endsWith(
    "/settings/profile"
  )
    ? "profile"
    : pathname.endsWith("/settings/account")
      ? "account"
      : undefined;

  return (
    <main className="container mx-auto px-4 py-6">
      <Link
        to="/profile"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to profile
      </Link>

      <h1 className="text-h1 mb-6">Settings</h1>

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
