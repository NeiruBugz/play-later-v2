"use client";

import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import {
  mapLibraryStatusToGameStatus,
  ProgressRing,
} from "@/shared/components/ui/progress-ring";
import { IMAGE_API, IMAGE_SIZES } from "@/shared/config/image.config";

import { statusLabels } from "../lib/constants";
import { prepareProfileData } from "../lib/prepare-profile-data";
import { LogoutButton } from "./logout-button";
import type { ProfileViewProps } from "./profile-view.types";

export function ProfileView({ profile }: ProfileViewProps) {
  const { displayName, joinDateFormatted, statusEntries } =
    prepareProfileData(profile);

  const totalGames = statusEntries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="space-y-3xl">
      <div className="flex flex-col gap-2xl sm:flex-row sm:items-start sm:justify-between">
        <div className="gap-2xl flex items-start">
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
            <h2 className="heading-xl font-serif">{displayName}</h2>
            {profile.email && (
              <p className="text-muted-foreground mt-xs text-sm">
                {profile.email}
              </p>
            )}
            <p className="text-muted-foreground mt-md text-sm">
              Joined {joinDateFormatted}
            </p>
          </div>
        </div>
        <div className="gap-md flex flex-col">
          <Button variant="outline" className="shrink-0" asChild>
            <Link href="/profile/settings">Edit Profile</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>
      {statusEntries.length > 0 && (
        <div>
          <h2 className="heading-lg mb-xl font-serif">Library Stats</h2>
          <div
            className="gap-lg grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            data-testid="profile-stats-grid"
          >
            {statusEntries.map(([status, count], index) => {
              const gameStatus = mapLibraryStatusToGameStatus(status);
              const percentage =
                totalGames > 0 ? Math.round((count / totalGames) * 100) : 0;

              return (
                <Card
                  key={status}
                  variant="interactive"
                  className="animate-fade-in p-xl hover:shadow-paper-md hover:scale-[1.02]"
                  style={{ animationDelay: `${(index + 1) * 50}ms` }}
                  data-testid="profile-status-card"
                >
                  <div className="gap-md flex flex-col items-center">
                    <ProgressRing
                      status={gameStatus}
                      progress={percentage}
                      size="md"
                      showPercentage
                    />
                    <div className="text-center">
                      <p
                        className="body-sm text-muted-foreground font-medium"
                        data-testid="profile-status-label"
                      >
                        {statusLabels[status] || status}
                      </p>
                      <p
                        className="heading-lg mt-xs"
                        data-testid="profile-status-count"
                      >
                        {count}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      {profile.stats.recentGames.length > 0 && (
        <div>
          <h2 className="heading-lg mb-xl font-serif">Recently Played</h2>
          <div
            className="gap-lg grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            data-testid="profile-recent-games-grid"
          >
            {profile.stats.recentGames.map((game, index) => {
              const src = game.coverImage
                ? `${IMAGE_API}/${IMAGE_SIZES["hd"]}/${game.coverImage}.webp`
                : "";
              return (
                <Card
                  key={game.gameId}
                  variant="interactive"
                  className="animate-fade-in group duration-normal ease-out-expo hover:shadow-paper-md overflow-hidden p-0 transition-all hover:scale-[1.01]"
                  style={{ animationDelay: `${(index + 1) * 50}ms` }}
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
                  <div className="p-lg">
                    <h3
                      className="text-foreground line-clamp-2 text-sm font-medium"
                      data-testid="profile-recent-game-title"
                    >
                      {game.title}
                    </h3>
                    <p
                      className="text-muted-foreground mt-xs text-xs"
                      data-testid="profile-recent-game-timestamp"
                    >
                      {formatDistanceToNow(new Date(game.lastPlayed), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      {statusEntries.length === 0 && profile.stats.recentGames.length === 0 && (
        <div className="border-border bg-muted p-4xl rounded-lg border text-center">
          <p className="body-lg text-muted-foreground">
            Your library is empty. Start adding games to your collection!
          </p>
        </div>
      )}
    </div>
  );
}
