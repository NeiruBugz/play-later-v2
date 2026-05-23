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
    <div className="space-y-md" data-testid={`user-list-${variant}`}>
      <p className="text-muted-foreground text-sm">
        <span className="text-foreground font-semibold tabular-nums">
          {total}
        </span>{" "}
        {variant === "followers" ? "followers" : "following"}
      </p>
      <ul className="divide-border/50 divide-y">
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
                    className="ring-border/50 h-10 w-10 rounded-full object-cover ring-1"
                  />
                ) : (
                  <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">
                    {initial}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm font-medium">
                  {displayName}
                </p>
                {entry.username ? (
                  <p className="text-muted-foreground truncate text-xs">
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
                  className="hover:bg-muted/50 -mx-1 block rounded-md transition-colors"
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
