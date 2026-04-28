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

export function ProfileHeader({
  profile,
  socialCounts,
  viewer,
}: ProfileHeaderProps) {
  const displayName = profile.name ?? profile.username;
  const avatarSrc = profile.image ?? "/default-avatar.svg";
  const avatarAlt = profile.image
    ? `${displayName}'s avatar`
    : `${profile.username}'s avatar`;
  const showFollowButton =
    viewer.isAuthenticated && !viewer.isOwner && profile.isPublicProfile;

  return (
    <div className="w-full">
      <div
        className="h-28 w-full rounded-t-lg sm:h-36"
        style={{ background: deriveBannerGradient(profile.id) }}
        aria-hidden="true"
      />

      <div className="px-4 sm:px-6">
        <div className="relative flex items-end justify-between">
          <div className="-mt-12 shrink-0 sm:-mt-16">
            <Image
              width={96}
              height={96}
              priority
              unoptimized
              src={avatarSrc}
              alt={avatarAlt}
              className="ring-background h-24 w-24 rounded-lg object-cover ring-4 sm:h-32 sm:w-32"
            />
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
            <SocialCountLink
              href={`/u/${profile.username}/followers`}
              count={socialCounts.followers}
              label="Followers"
            />

            <span className="text-border mx-1">·</span>

            <SocialCountLink
              href={`/u/${profile.username}/following`}
              count={socialCounts.following}
              label="Following"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialCountLink({
  href,
  count,
  label,
}: {
  href: string;
  count: number;
  label: string;
}) {
  return (
    <Link href={href} className="hover:text-foreground transition-colors">
      <span className="text-foreground font-semibold tabular-nums">
        {count}
      </span>{" "}
      {label}
    </Link>
  );
}

export type { ProfileHeaderProps };
