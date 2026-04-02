import Image from "next/image";
import Link from "next/link";

import { FollowButton } from "@/features/social";
import { GameCoverImage } from "@/shared/components/game-cover-image";

type LibraryPreviewGame = {
  title: string;
  coverImage: string | null;
  slug: string;
};

type PublicProfileViewProps = {
  profile: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
    gameCount: number;
    followersCount: number;
    followingCount: number;
    libraryPreview: LibraryPreviewGame[];
  };
  isOwnProfile: boolean;
  isAuthenticated: boolean;
  isFollowing?: boolean;
};

export function PublicProfileView({
  profile,
  isOwnProfile,
  isAuthenticated,
  isFollowing,
}: PublicProfileViewProps) {
  const displayName = profile.name ?? profile.username;

  return (
    <div className="space-y-2xl">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="shrink-0">
          {profile.image ? (
            <Image
              width={96}
              height={96}
              priority
              src={profile.image}
              alt={`${displayName}'s avatar`}
              className="ring-border/50 h-24 w-24 rounded-lg object-cover ring-1"
            />
          ) : (
            <div className="bg-primary/10 text-primary flex h-24 w-24 items-center justify-center rounded-lg text-3xl font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </div>
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
            <span className="text-foreground font-semibold tabular-nums">
              {profile.gameCount}
            </span>
            <span>Games</span>

            <span className="text-border mx-1">·</span>

            <Link
              href={`/u/${profile.username}/followers`}
              className="hover:text-foreground transition-colors"
            >
              <span className="text-foreground font-semibold tabular-nums">
                {profile.followersCount}
              </span>{" "}
              Followers
            </Link>

            <span className="text-border mx-1">·</span>

            <Link
              href={`/u/${profile.username}/following`}
              className="hover:text-foreground transition-colors"
            >
              <span className="text-foreground font-semibold tabular-nums">
                {profile.followingCount}
              </span>{" "}
              Following
            </Link>
          </div>

          {isAuthenticated && !isOwnProfile && (
            <FollowButton
              followingId={profile.id}
              initialIsFollowing={isFollowing ?? false}
            />
          )}
        </div>
      </div>

      {isOwnProfile && (
        <div className="bg-muted/50 border-border/50 rounded-lg border px-4 py-3 text-center text-sm">
          <span className="text-muted-foreground">
            This is how others see your profile.{" "}
          </span>
          <Link
            href="/profile/settings"
            className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline"
          >
            Edit profile
          </Link>
        </div>
      )}

      {profile.libraryPreview.length > 0 && (
        <div>
          <h2 className="heading-md mb-lg tracking-tight">Library</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {profile.libraryPreview.map((game) => (
              <Link
                key={game.slug}
                href={`/games/${game.slug}`}
                className="group"
              >
                <GameCoverImage
                  imageId={game.coverImage}
                  gameTitle={game.title}
                  size="cover_big"
                  className="aspect-[3/4] w-full rounded-md"
                  sizes="(max-width: 640px) 30vw, 16vw"
                />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export type { PublicProfileViewProps };
