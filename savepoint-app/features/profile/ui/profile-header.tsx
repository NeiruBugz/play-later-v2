import Image from "next/image";
import Link from "next/link";

import { FollowButton } from "@/features/social";

import { LogoutButton } from "./logout-button";

type ProfileHeaderProps = {
  profile: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
    isPublicProfile: boolean;
    email?: string | null;
  };
  socialCounts: {
    followers: number;
    following: number;
  };
  viewer: {
    isOwner: boolean;
    isAuthenticated: boolean;
    isFollowing?: boolean;
  };
};

export function ProfileHeader({
  profile,
  socialCounts,
  viewer,
}: ProfileHeaderProps) {
  const displayName = profile.name ?? profile.username;
  const showFollowButton =
    viewer.isAuthenticated && !viewer.isOwner && profile.isPublicProfile;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
      <div className="shrink-0">
        {profile.image ? (
          <Image
            width={96}
            height={96}
            priority
            unoptimized
            src={profile.image}
            alt={`${displayName}'s avatar`}
            className="ring-border/50 h-24 w-24 rounded-lg object-cover ring-1"
          />
        ) : (
          <Image
            width={96}
            height={96}
            priority
            unoptimized
            src="/default-avatar.svg"
            alt={`${profile.username}'s avatar`}
            className="ring-border/50 h-24 w-24 rounded-lg object-cover ring-1"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col items-center gap-3 sm:items-start">
        <div className="text-center sm:text-left">
          <h1 className="heading-xl tracking-tight">{displayName}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            @{profile.username}
          </p>
        </div>

        <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <Link
            href={`/u/${profile.username}/followers`}
            className="hover:text-foreground transition-colors"
          >
            <span className="text-foreground font-semibold tabular-nums">
              {socialCounts.followers}
            </span>{" "}
            Followers
          </Link>

          <span className="text-border mx-1">·</span>

          <Link
            href={`/u/${profile.username}/following`}
            className="hover:text-foreground transition-colors"
          >
            <span className="text-foreground font-semibold tabular-nums">
              {socialCounts.following}
            </span>{" "}
            Following
          </Link>
        </div>

        {showFollowButton && (
          <FollowButton
            followingId={profile.id}
            initialIsFollowing={viewer.isFollowing ?? false}
          />
        )}

        {viewer.isOwner && (
          <div className="flex flex-col items-center gap-2 sm:items-start">
            {profile.email && (
              <p className="text-muted-foreground text-sm">{profile.email}</p>
            )}
            <div className="flex items-center gap-2">
              <Link
                href="/profile/settings"
                className="text-sm font-medium underline-offset-4 hover:underline"
              >
                Edit Profile
              </Link>
              <LogoutButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export type { ProfileHeaderProps };
