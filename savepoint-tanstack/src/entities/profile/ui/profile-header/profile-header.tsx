import type { ProfileHeaderProps } from "./profile-header.type";

const DEFAULT_AVATAR_SRC = "/default-avatar.png";

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const displayName = profile.name ?? profile.username ?? "User";
  const avatarSrc = profile.image ?? DEFAULT_AVATAR_SRC;

  return (
    <div className="w-full">
      <div className="px-4 sm:px-6">
        <div className="-mt-12 shrink-0 sm:-mt-16">
          <img
            src={avatarSrc}
            alt={displayName}
            width={96}
            height={96}
            className="ring-background h-24 w-24 rounded-lg object-cover ring-4 sm:h-32 sm:w-32"
          />
        </div>

        <div className="mt-3 space-y-1">
          <h1 className="text-display tracking-tight">{displayName}</h1>
          <p className="text-caption text-muted-foreground">
            @{profile.username ?? ""}
          </p>
        </div>
      </div>
    </div>
  );
}

export type { ProfileHeaderProps };
