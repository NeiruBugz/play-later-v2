import type { ProfileWithStats } from "@/data-access-layer/services";
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
                src={profile.image}
                alt={`${displayName}'s avatar`}
                className="h-24 w-24 rounded-full object-cover ring-2 ring-gray-200"
              />
            ) : (
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-500"
                data-testid="profile-avatar-placeholder"
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h2 className="font-serif text-3xl font-bold text-gray-900">
              {displayName}
            </h2>
            {profile.email && (
              <p className="mt-1 text-sm text-gray-600">{profile.email}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
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
          <h2 className="mb-4 font-serif text-2xl font-bold text-gray-900">
            Library Stats
          </h2>
          <div
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
            data-testid="profile-stats-grid"
          >
            {statusEntries.map(([status, count]) => (
              <div
                key={status}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                data-testid="profile-status-card"
              >
                <p
                  className="text-sm font-medium text-gray-600"
                  data-testid="profile-status-label"
                >
                  {statusLabels[status] || status}
                </p>
                <p
                  className="mt-1 text-2xl font-bold text-gray-900"
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
          <h2 className="mb-4 font-serif text-2xl font-bold text-gray-900">
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
                  className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
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
                      className="aspect-3/4 w-full bg-gray-200"
                      data-testid="profile-game-cover-fallback"
                    ></div>
                  )}

                  <div className="p-3">
                    <h3
                      className="line-clamp-2 text-sm font-medium text-gray-900"
                      data-testid="profile-recent-game-title"
                    >
                      {game.title}
                    </h3>
                    <p
                      className="mt-1 text-xs text-gray-500"
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
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-lg text-gray-600">
            Your library is empty. Start adding games to your collection!
          </p>
        </div>
      )}
    </div>
  );
}
