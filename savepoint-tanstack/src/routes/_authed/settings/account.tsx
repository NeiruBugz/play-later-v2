import { createFileRoute } from "@tanstack/react-router";

import { LogoutButton } from "@/features/auth-sign-out";
import { SignOutCard } from "@/features/manage-account";
import {
  getSteamConnectionFn,
  SteamConnectCard,
} from "@/features/steam-connect";

export const Route = createFileRoute("/_authed/settings/account")({
  loader: () => getSteamConnectionFn(),
  component: SettingsAccountPage,
});

function SettingsAccountPage() {
  const { steamId, connectUrl } = Route.useLoaderData();

  // Chrome (header, back-link, settings-nav rail) is owned by the parent
  // `_authed/settings.tsx` layout route. Child renders content only.
  return (
    <div>
      <h2 className="text-h2 mb-6">Account</h2>

      <div className="space-y-6">
        <SteamConnectCard steamId={steamId} connectUrl={connectUrl} />
        <SignOutCard action={<LogoutButton />} />
      </div>
    </div>
  );
}
