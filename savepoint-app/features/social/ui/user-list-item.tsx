import Image from "next/image";
import Link from "next/link";

export type UserListUser = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

export function UserListItem({ user }: { user: UserListUser }) {
  const displayName = user.name ?? user.username ?? "Unknown";
  const initial = displayName.charAt(0).toUpperCase();

  const content = (
    <div className="flex items-center gap-3 px-1 py-3">
      <div className="shrink-0">
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
            {initial}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-foreground truncate text-sm font-medium">
          {displayName}
        </p>
        {user.username && (
          <p className="text-muted-foreground truncate text-xs">
            @{user.username}
          </p>
        )}
      </div>
    </div>
  );

  if (user.username) {
    return (
      <Link
        href={`/u/${user.username}`}
        className="hover:bg-muted/50 -mx-1 block rounded-md transition-colors"
      >
        {content}
      </Link>
    );
  }

  return content;
}
