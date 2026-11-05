import { Link } from "@tanstack/react-router";

import { EmptyState } from "@/shared/ui/empty-state";

import type { UserListProps } from "./user-list.type";

const DEFAULT_AVATAR_SRC = "/default-avatar.png";

const EMPTY_COPY: Record<
  UserListProps["variant"],
  { title: string; description: string }
> = {
  followers: {
    title: "No followers yet",
    description:
      "When other players follow this profile, they'll show up here.",
  },
  following: {
    title: "Not following anyone yet",
    description: "Follow other players to see their library activity here.",
  },
};

export function UserList({ variant, entries, total }: UserListProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        data-testid={`user-list-empty-${variant}`}
        title={EMPTY_COPY[variant].title}
        description={EMPTY_COPY[variant].description}
      />
    );
  }

  return (
    <div className="space-y-2" data-testid={`user-list-${variant}`}>
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">
          {total}
        </span>{" "}
        {variant === "followers" ? "followers" : "following"}
      </p>
      <ul className="divide-y divide-border/50">
        {entries.map((entry) => {
          const displayName = entry.name ?? entry.username ?? "Unknown";
          const initial = displayName.charAt(0).toUpperCase();
          const avatarSrc = entry.image ?? DEFAULT_AVATAR_SRC;

          const inner = (
            <div
              className="flex items-center gap-3 px-1 py-3"
              data-testid="user-list-item"
            >
              <div className="shrink-0">
                {entry.image ? (
                  <img
                    src={avatarSrc}
                    alt={`${displayName}'s avatar`}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover ring-1 ring-border/50"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {initial}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {displayName}
                </p>
                {entry.username ? (
                  <p className="truncate text-xs text-muted-foreground">
                    @{entry.username}
                  </p>
                ) : null}
              </div>
            </div>
          );

          return (
            <li key={entry.id}>
              {entry.username ? (
                <Link
                  to="/u/$username"
                  params={{ username: entry.username }}
                  className="-mx-1 block rounded-md transition-colors hover:bg-muted/50"
                >
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
