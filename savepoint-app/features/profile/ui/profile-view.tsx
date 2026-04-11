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
      <div
        aria-hidden
        className="jewel:flex jewel-meta hidden items-center gap-3 opacity-60"
      >
        <span>{"// PROFILE.VIEW"}</span>
        <span className="h-px flex-1 bg-[oklch(0.72_0.22_145/0.3)]" />
        <span>
          {(profile.username ?? profile.email ?? "USER")
            .slice(0, 16)
            .toUpperCase()}
        </span>
      </div>
      <div className="gap-xl flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="gap-lg flex items-center">
          <div className="jewel-corners jewel-neon-bloom shrink-0 rounded-lg">
            {profile.image ? (
              <Image
                width={80}
                height={80}
                priority
                src={profile.image}
                alt={`${displayName}'s avatar`}
                className="ring-border/50 jewel:ring-primary/40 h-20 w-20 rounded-lg object-cover ring-1"
              />
            ) : (
              <div
                className="bg-primary/10 text-primary jewel-glass-strong jewel-neon-text flex h-20 w-20 items-center justify-center rounded-lg text-2xl font-semibold"
                data-testid="profile-avatar-placeholder"
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="heading-xl jewel-display jewel:tracking-[0.06em] tracking-tight">
              {displayName}
            </h1>
            <div className="text-muted-foreground jewel-meta jewel:text-[0.68rem] mt-1 flex flex-wrap items-center gap-2 text-sm">
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
          <div className="mb-lg jewel-progress-glow flex h-3 overflow-hidden rounded-full">
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
              const statusKey =
                status === "UP_NEXT" ? "upNext" : status.toLowerCase();
              return (
                <div
                  key={status}
                  className="jewel:flex jewel:flex-col jewel:gap-1"
                >
                  <div className="jewel:flex hidden items-center gap-2">
                    <span
                      className="jewel-dot h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: `var(--status-${statusKey})`,
                      }}
                    />
                    <span className="jewel-meta text-[0.6rem]">
                      {statusLabels[status] || status}
                    </span>
                  </div>
                  <p
                    className="jewel:hidden text-2xl font-bold tabular-nums"
                    data-testid="profile-status-count"
                  >
                    {statusLabels[status] || status}
                  </p>
                  <p className="jewel:block jewel-neon-text hidden text-3xl font-bold tabular-nums">
                    {count}
                  </p>
                  <p className="text-muted-foreground jewel:hidden text-sm">
                    <span className="text-foreground font-semibold tabular-nums">
                      {count}
                    </span>{" "}
                    Games{" "}
                    <span
                      className="tabular-nums"
                      style={{
                        color: `var(--status-${statusKey})`,
                      }}
                    >
                      {percentage}%
                    </span>
                  </p>
                  <p className="jewel-meta jewel:block hidden text-[0.6rem]">
                    {count} games ·{" "}
                    <span
                      className="tabular-nums"
                      style={{
                        color: `var(--status-${statusKey})`,
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
          <div
            aria-hidden
            className="jewel:flex jewel-meta mb-md hidden items-center gap-3 opacity-60"
          >
            <span>{"// RECENT.PLAYS"}</span>
            <span className="h-px flex-1 bg-[oklch(0.72_0.22_145/0.25)]" />
            <span>
              {String(profile.stats.recentGames.length).padStart(3, "0")}
            </span>
          </div>
          <h2 className="heading-md mb-lg jewel-display jewel:tracking-[0.08em] tracking-tight">
            Recently Played
          </h2>
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
                  className="animate-fade-in group jewel-chrome-thin jewel-glass jewel-neon-bloom jewel-hover-rise jewel-corners jewel-breathe-slow relative overflow-hidden rounded-lg"
                  style={{
                    animationDelay: `${(index + 1) * 50}ms`,
                    ["--jewel-stagger" as string]: `${(index * 220) % 2000}ms`,
                  }}
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
                  <div className="jewel:from-[oklch(0.08_0.03_270/0.95)] jewel:via-[oklch(0.08_0.03_270/0.65)] absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-8">
                    <h3
                      className="jewel-display jewel:text-[0.72rem] jewel:tracking-[0.04em] jewel:font-normal line-clamp-2 text-sm font-semibold text-white drop-shadow-md"
                      data-testid="profile-recent-game-title"
                    >
                      {game.title}
                    </h3>
                    <p
                      className="jewel-meta jewel:text-[0.58rem] mt-1 text-xs text-white/60"
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
