import type { FollowUserProfile } from "@/data-access-layer/repository";
import Image from "next/image";
import Link from "next/link";

type FollowersListProps = {
  users: FollowUserProfile[];
  total: number;
};

export function FollowersList({ users, total }: FollowersListProps) {
  if (users.length === 0) {
    return (
      <div className="border-border/50 bg-card rounded-lg border p-6 text-center">
        <p className="text-muted-foreground body-sm">No followers yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-md">
      <p className="text-muted-foreground text-sm">
        <span className="text-foreground font-semibold tabular-nums">
          {total}
        </span>{" "}
        {total === 1 ? "follower" : "followers"}
      </p>

      <ul className="divide-border/50 divide-y">
        {users.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </ul>
    </div>
  );
}

function UserRow({ user }: { user: FollowUserProfile }) {
  const displayName = user.name ?? user.username ?? "Unknown";
  const profileHref = user.username ? `/u/${user.username}` : "#";

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <Link
        href={profileHref}
        className="hover:bg-muted/50 -mx-2 flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors"
      >
        {user.image ? (
          <Image
            width={40}
            height={40}
            src={user.image}
            alt={`${displayName}'s avatar`}
            className="ring-border/50 h-10 w-10 rounded-full object-cover ring-1"
          />
        ) : (
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="body-sm truncate font-medium">{displayName}</p>
          {user.username && (
            <p className="text-muted-foreground truncate text-xs">
              @{user.username}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}

export type { FollowersListProps };
