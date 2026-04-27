import Image from "next/image";
import Link from "next/link";

import { FollowButton } from "@/features/social";

import { deriveBannerGradient } from "../lib/derive-banner-gradient";

type ProfileHeaderProps = {
  profile: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
    isPublicProfile: boolean;
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

const BANNER_HEIGHT = "h-28 sm:h-36";
const AVATAR_SIZE = 96;

export function ProfileHeader({
  profile,
  socialCounts,
  viewer,
}: ProfileHeaderProps) {
  const displayName = profile.name ?? profile.username;
  const showFollowButton =
    viewer.isAuthenticated && !viewer.isOwner && profile.isPublicProfile;
  const bannerGradient = deriveBannerGradient(profile.id);

  return (
    <div className="w-full">
      <div
        className={`${BANNER_HEIGHT} w-full rounded-t-lg`}
        style={{ background: bannerGradient }}
        aria-hidden="true"
      />

      <div className="px-4 sm:px-6">
        <div className="relative flex items-end justify-between">
          <div className="-mt-12 shrink-0 sm:-mt-16">
            {profile.image ? (
              <Image
                width={AVATAR_SIZE}
                height={AVATAR_SIZE}
                priority
                unoptimized
                src={profile.image}
                alt={`${displayName}'s avatar`}
                className="ring-background h-24 w-24 rounded-lg object-cover ring-4 sm:h-32 sm:w-32"
              />
            ) : (
              <Image
                width={AVATAR_SIZE}
                height={AVATAR_SIZE}
                priority
                unoptimized
                src="/default-avatar.svg"
                alt={`${profile.username}'s avatar`}
                className="ring-background h-24 w-24 rounded-lg object-cover ring-4 sm:h-32 sm:w-32"
              />
            )}
          </div>

          <div className="pb-2">
            {showFollowButton && (
              <FollowButton
                followingId={profile.id}
                initialIsFollowing={viewer.isFollowing ?? false}
              />
            )}

            {viewer.isOwner && (
              <Link
                href="/settings/profile"
                className="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <h1 className="text-display tracking-tight">{displayName}</h1>
          <p className="text-caption text-muted-foreground">
            @{profile.username}
          </p>

          <div className="text-caption text-muted-foreground flex items-center gap-1.5 pt-1">
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
        </div>
      </div>
    </div>
  );
}

export type { ProfileHeaderProps };
