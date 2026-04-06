"use client";

import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";

import { statusLabels } from "@/features/profile/lib";
import { Button } from "@/shared/components/ui/button";
import { IMAGE_API, IMAGE_SIZES } from "@/shared/config/image.config";

import { prepareProfileData } from "../lib/prepare-profile-data";
import { LogoutButton } from "./logout-button";
import type { ProfileViewProps, SocialCounts } from "./profile-view.types";

export function ProfileView({ profile, socialCounts }: ProfileViewProps) {
  const { displayName, joinDateFormatted, statusEntries, quickStats } =
    prepareProfileData(profile);

  const totalGames = quickStats.totalGames;

  return (
    <div className="space-y-2xl">
      <div className="gap-xl flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="gap-lg flex items-center">
          <div className="shrink-0">
            {profile.image ? (
              <Image
                width={80}
                height={80}
                priority
                src={profile.image}
                alt={`${displayName}'s avatar`}
                className="ring-border/50 h-20 w-20 rounded-lg object-cover ring-1"
              />
            ) : (
              <div
                className="bg-primary/10 text-primary flex h-20 w-20 items-center justify-center rounded-lg text-2xl font-semibold"
                data-testid="profile-avatar-placeholder"
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="heading-xl tracking-tight">{displayName}</h1>
            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-sm">
              {profile.email && (
                <>
                  <span>{profile.email}</span>
                  <span className="text-border">•</span>
                </>
              )}
              <span>Joined {joinDateFormatted}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile/settings">Edit Profile</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      {socialCounts && profile.username && (
        <SocialStatsRow counts={socialCounts} username={profile.username} />
      )}

      {statusEntries.length > 0 && totalGames > 0 && (
        <div data-testid="profile-stats-grid">
          <div className="mb-lg flex h-3 overflow-hidden rounded-full">
            {statusEntries.map(([status, count]) => {
              const percentage =
                totalGames > 0 ? (count / totalGames) * 100 : 0;
              return (
                <div
                  key={status}
                  className="transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: `var(--status-${status === "UP_NEXT" ? "upNext" : status.toLowerCase()})`,
                  }}
                />
              );
            })}
          </div>
          <div
            className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4"
            data-testid="profile-status-cards"
          >
            {statusEntries.map(([status, count]) => {
              const percentage =
                totalGames > 0 ? Math.round((count / totalGames) * 100) : 0;
              return (
                <div key={status}>
                  <p
                    className="text-2xl font-bold tabular-nums"
                    data-testid="profile-status-count"
                  >
                    {statusLabels[status] || status}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    <span className="text-foreground font-semibold tabular-nums">
                      {count}
                    </span>{" "}
                    Games{" "}
                    <span
                      className="tabular-nums"
                      style={{
                        color: `var(--status-${status === "UP_NEXT" ? "upNext" : status.toLowerCase()})`,
                      }}
                    >
                      {percentage}%
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {profile.stats.recentGames.length > 0 && (
        <div>
          <h2 className="heading-md mb-lg tracking-tight">Recently Played</h2>
          <div
            className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8"
            data-testid="profile-recent-games-grid"
          >
            {profile.stats.recentGames.map((game, index) => {
              const src = game.coverImage
                ? `${IMAGE_API}/${IMAGE_SIZES["hd"]}/${game.coverImage}.webp`
                : "";
              return (
                <div
                  key={game.gameId}
                  className="animate-fade-in group relative overflow-hidden rounded-lg"
                  style={{ animationDelay: `${(index + 1) * 50}ms` }}
                  data-testid="profile-recent-game-card"
                >
                  {game.coverImage ? (
                    <Image
                      width={200}
                      height={267}
                      src={src}
                      alt={game.title}
                      className="aspect-[3/4] w-full object-cover"
                    />
                  ) : (
                    <div
                      className="bg-muted aspect-[3/4] w-full"
                      data-testid="profile-game-cover-fallback"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-8">
                    <h3
                      className="line-clamp-2 text-sm font-semibold text-white drop-shadow-md"
                      data-testid="profile-recent-game-title"
                    >
                      {game.title}
                    </h3>
                    <p
                      className="mt-1 text-xs text-white/60"
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
        <div className="border-border/50 bg-card p-3xl rounded-lg border text-center">
          <p className="body-md text-muted-foreground">
            Your library is empty. Start adding games to your collection!
          </p>
        </div>
      )}
    </div>
  );
}

function SocialStatsRow({
  counts,
  username,
}: {
  counts: SocialCounts;
  username: string;
}) {
  return (
    <div
      className="text-muted-foreground flex items-center gap-1.5 text-sm"
      data-testid="profile-social-stats"
    >
      <Link
        href={`/u/${username}/followers`}
        className="hover:text-foreground transition-colors"
      >
        <span className="text-foreground font-semibold tabular-nums">
          {counts.followers}
        </span>{" "}
        {counts.followers === 1 ? "Follower" : "Followers"}
      </Link>

      <span className="text-border mx-1">&middot;</span>

      <Link
        href={`/u/${username}/following`}
        className="hover:text-foreground transition-colors"
      >
        <span className="text-foreground font-semibold tabular-nums">
          {counts.following}
        </span>{" "}
        Following
      </Link>
    </div>
  );
}
