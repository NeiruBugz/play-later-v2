import type { ProfileWithStats } from "@/shared/types/profile";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { IMAGE_API, IMAGE_SIZES } from "@/shared/config/image.config";

import { statusLabels } from "../lib/constants";
import { prepareProfileData } from "../lib/prepare-profile-data";
import { LogoutButton } from "./logout-button";

type ProfileViewProps = {
  profile: ProfileWithStats;
};

export function ProfileView({ profile }: ProfileViewProps) {
  const { displayName, joinDateFormatted, statusEntries } =
    prepareProfileData(profile);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-6">
          <div className="shrink-0">
            {profile.image ? (
              <Image
                width={96}
                height={96}
                priority
                src={profile.image}
                alt={`${displayName}'s avatar`}
                className="h-24 w-24 rounded-full object-cover ring-2 ring-[oklch(var(--border))]"
              />
            ) : (
              <div
                className="bg-muted text-muted-foreground flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold"
                data-testid="profile-avatar-placeholder"
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-foreground font-serif text-3xl font-bold">
              {displayName}
            </h2>
            {profile.email && (
              <p className="text-muted-foreground mt-1 text-sm">
                {profile.email}
              </p>
            )}
            <p className="text-muted-foreground mt-2 text-sm">
              Joined {joinDateFormatted}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="outline" className="shrink-0" asChild>
            <Link href="/profile/settings">Edit Profile</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      {statusEntries.length > 0 && (
        <div>
          <h2 className="text-foreground mb-4 font-serif text-2xl font-bold">
            Library Stats
          </h2>
          <div
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
            data-testid="profile-stats-grid"
          >
            {statusEntries.map(([status, count]) => (
              <div
                key={status}
                className="border-border bg-card rounded-lg border p-4 shadow-sm"
                data-testid="profile-status-card"
              >
                <p
                  className="text-muted-foreground text-sm font-medium"
                  data-testid="profile-status-label"
                >
                  {statusLabels[status] || status}
                </p>
                <p
                  className="text-foreground mt-1 text-2xl font-bold"
                  data-testid="profile-status-count"
                >
                  {count}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.stats.recentGames.length > 0 && (
        <div>
          <h2 className="text-foreground mb-4 font-serif text-2xl font-bold">
            Recently Played
          </h2>
          <div
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            data-testid="profile-recent-games-grid"
          >
            {profile.stats.recentGames.map((game) => {
              const src = game.coverImage
                ? `${IMAGE_API}/${IMAGE_SIZES["hd"]}/${game.coverImage}.webp`
                : "";
              return (
                <div
                  key={game.gameId}
                  className="group border-border bg-card overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-md"
                  data-testid="profile-recent-game-card"
                >
                  {game.coverImage ? (
                    <Image
                      width={200}
                      height={267}
                      src={src}
                      alt={game.title}
                      className="aspect-3/4 w-full object-cover"
                    />
                  ) : (
                    <div
                      className="bg-muted aspect-3/4 w-full"
                      data-testid="profile-game-cover-fallback"
                    ></div>
                  )}

                  <div className="p-3">
                    <h3
                      className="text-foreground line-clamp-2 text-sm font-medium"
                      data-testid="profile-recent-game-title"
                    >
                      {game.title}
                    </h3>
                    <p
                      className="text-muted-foreground mt-1 text-xs"
                      data-testid="profile-recent-game-timestamp"
                    >
                      {formatDistanceToNow(new Date(game.lastPlayed), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {statusEntries.length === 0 && profile.stats.recentGames.length === 0 && (
        <div className="border-border bg-muted rounded-lg border p-12 text-center">
          <p className="text-muted-foreground text-lg">
            Your library is empty. Start adding games to your collection!
          </p>
        </div>
      )}
    </div>
  );
}
