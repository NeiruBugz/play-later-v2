import { Link } from "@tanstack/react-router";

import { getDisplayName } from "@/entities/profile/model";
import { buttonVariants } from "@/shared/ui/button";

import { UserList } from "../user-list";
import type { UserConnectionsPageProps } from "./user-connections-page.type";

export function UserConnectionsPage({
  kind,
  profile,
  entries,
  total,
}: UserConnectionsPageProps) {
  const displayName = getDisplayName(profile, "User");
  const handle = profile.username ?? "user";

  return (
    <div className="container mx-auto max-w-2xl space-y-2 px-4 py-6">
      <div className="space-y-1">
        <Link
          to="/u/$username"
          params={{ username: profile.username ?? "" }}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          ← Back to {displayName}
        </Link>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {kind === "followers" ? "Followers" : "Following"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {kind === "followers"
            ? `People following @${handle}`
            : `People @${handle} follows`}
        </p>
      </div>
      <UserList variant={kind} entries={entries} total={total} />
    </div>
  );
}
