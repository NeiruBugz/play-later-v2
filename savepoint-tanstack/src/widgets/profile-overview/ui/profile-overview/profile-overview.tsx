import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";

import { AvatarUpload } from "@/features/upload-avatar";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { SegmentedControl } from "@/shared/ui/segmented-control";

import { deriveBannerGradient } from "../../lib/derive-banner-gradient";
import { formatRelativeTime } from "../../lib/format-relative-time";
import type { ProfileOverviewProps } from "./profile-overview.type";

const DEFAULT_AVATAR_SRC = "/default-avatar.png";

export function ProfileOverview({
  profile,
  stats,
  isOwnProfile = false,
  followerCount,
  followingCount,
  headerActions,
  librarySlot,
  activitySlot,
  playthroughsSlot,
  hideActivityTab = false,
}: ProfileOverviewProps) {
  // Never expose an email-shaped `name` — see README "Display-name privacy".
  const nonEmailName =
    profile.name && !profile.name.includes("@") ? profile.name : null;
  const displayName = nonEmailName ?? profile.username ?? "User";
  const usernameSlug = profile.username ?? profile.id;
  const avatarSrc = profile.image ?? DEFAULT_AVATAR_SRC;

  const gameCount = Object.values(stats.statusCounts).reduce(
    (sum, count) => sum + (count ?? 0),
    0
  );
  const played = stats.statusCounts.PLAYED ?? 0;

  // Compact stat row: 4 key numbers inline (design ref sp-screens-c.jsx ProfileScreen).
  const inlineStats = [
    { label: "in library", value: gameCount },
    { label: "played", value: played },
    { label: "completed", value: stats.completedCount ?? 0 },
    { label: "entries", value: stats.journalCount ?? 0 },
  ] as const;

  // Primary action renders below the identity block as a full-width button (AC PRO-2).
  const hasPrimaryAction = isOwnProfile || headerActions !== undefined;

  return (
    <div>
      <header data-testid="profile-hero">
        {/* Banner: tokenized height — no arbitrary [120px]/[140px] values */}
        <div
          data-testid="profile-hero-banner"
          aria-hidden="true"
          className="relative h-20 w-full md:h-36"
          style={{ background: deriveBannerGradient(usernameSlug) }}
        />

        {/* Identity block: avatar + name + handle + stat row + primary action */}
        <div data-testid="profile-identity-block" className="px-4 pb-4 md:px-6">
          {/* Avatar row — negative margin pulls it up over the banner */}
          <div className="-mt-10 mb-3 flex items-end justify-between md:-mt-14">
            <div className="relative inline-block">
              <img
                src={avatarSrc}
                alt={displayName}
                width={80}
                height={80}
                className="ring-background h-20 w-20 rounded-full object-cover ring-4 md:h-28 md:w-28"
              />
              {isOwnProfile ? (
                <div className="absolute inset-x-0 bottom-0 rounded-b-full bg-black/60 px-2 py-1 text-center text-xs text-white">
                  <AvatarUpload label="Change avatar" />
                </div>
              ) : null}
            </div>

            {/* Desktop: primary action floated to the right of the avatar */}
            {hasPrimaryAction ? (
              <div className="hidden shrink-0 md:block">
                <PrimaryActionContent
                  isOwnProfile={isOwnProfile}
                  headerActions={headerActions}
                  className=""
                />
              </div>
            ) : null}
          </div>

          {/* Name + handle */}
          <h1 className="font-serif text-2xl tracking-tight md:text-4xl">
            {displayName}
          </h1>
          {profile.username ? (
            <p className="text-muted-foreground mt-0.5 text-sm">
              @{profile.username}
            </p>
          ) : null}

          {/* Follower / following counts */}
          {profile.username &&
          followerCount !== undefined &&
          followingCount !== undefined ? (
            <p
              className="text-muted-foreground mt-1 text-sm"
              data-testid="profile-social-counts"
            >
              <Link
                to="/u/$username/followers"
                params={{ username: profile.username }}
                className="hover:text-foreground transition-colors"
              >
                <span className="text-foreground font-medium tabular-nums">
                  {followerCount}
                </span>{" "}
                Followers
              </Link>
              <span aria-hidden="true" className="mx-1">
                ·
              </span>
              <Link
                to="/u/$username/following"
                params={{ username: profile.username }}
                className="hover:text-foreground transition-colors"
              >
                <span className="text-foreground font-medium tabular-nums">
                  {followingCount}
                </span>{" "}
                Following
              </Link>
            </p>
          ) : null}

          {/* Compact inline stat row (AC PRO-1) */}
          <div data-testid="profile-stat-row" className="mt-3 flex gap-5">
            {inlineStats.map(({ label, value }) => (
              <div key={label} data-testid="profile-stat-item">
                <span className="text-foreground text-base font-bold tabular-nums">
                  {value}
                </span>
                <p className="text-muted-foreground text-xs">{label}</p>
              </div>
            ))}
          </div>

          {/* Full-width primary action below identity block (AC PRO-2) — mobile only */}
          {hasPrimaryAction ? (
            <div
              data-testid="profile-primary-action"
              className="mt-4 w-full md:hidden"
            >
              <PrimaryActionContent
                isOwnProfile={isOwnProfile}
                headerActions={headerActions}
                className="w-full"
              />
            </div>
          ) : null}
        </div>
      </header>

      {/* Sticky tab strip directly above content (AC PRO-1) */}
      <ProfileOverviewTabs
        hideActivityTab={hideActivityTab}
        overview={
          <div className="space-y-8">
            {stats.recentGames.length > 0 ? (
              <section data-testid="overview-recently-played">
                <h2 className="heading-md mb-4 tracking-tight">
                  Recently Played
                </h2>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
                  {stats.recentGames.map((game) => (
                    <Link
                      key={game.gameId}
                      to="/games/$slug"
                      params={{ slug: String(game.gameId) }}
                      className="group relative block overflow-hidden rounded-lg"
                      data-testid="overview-recently-played-entry"
                    >
                      {game.coverImage ? (
                        <img
                          src={game.coverImage}
                          alt={`Cover for ${game.title}`}
                          className="aspect-[3/4] w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="bg-muted aspect-[3/4] w-full" />
                      )}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent"
                      />
                      <div className="absolute inset-x-0 bottom-0 space-y-0.5 p-2 text-white">
                        <p className="line-clamp-2 text-xs leading-tight font-medium">
                          {game.title}
                        </p>
                        <p className="text-[10px] text-white/80">
                          {formatRelativeTime(new Date(game.lastPlayed))}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {playthroughsSlot !== undefined ? (
              <section data-testid="overview-playthroughs">
                <h2 className="heading-md mb-4 tracking-tight">Playthroughs</h2>
                {playthroughsSlot}
              </section>
            ) : null}
          </div>
        }
        library={
          librarySlot !== undefined ? (
            librarySlot
          ) : (
            <EmptyState
              data-testid="profile-library-empty"
              title="No games yet"
              description="This profile hasn't added any games to their library."
            />
          )
        }
        activity={
          activitySlot !== undefined ? (
            activitySlot
          ) : (
            <EmptyState
              data-testid="profile-activity-empty"
              title="No activity yet"
              description="Activity will appear here once journal entries and library changes are tracked publicly."
            />
          )
        }
      />
    </div>
  );
}

interface PrimaryActionContentProps {
  isOwnProfile: boolean;
  headerActions: ReactNode | undefined;
  className: string;
}

function PrimaryActionContent({
  isOwnProfile,
  headerActions,
  className,
}: PrimaryActionContentProps) {
  if (headerActions !== undefined) {
    return <div className={className}>{headerActions}</div>;
  }
  if (isOwnProfile) {
    return (
      <Button asChild variant="outline" className={className}>
        <Link to="/settings/profile">Edit Profile</Link>
      </Button>
    );
  }
  return null;
}

type ProfileTabValue = "overview" | "library" | "activity";

interface ProfileOverviewTabsProps {
  hideActivityTab: boolean;
  overview: ReactNode;
  library: ReactNode;
  activity: ReactNode;
}

function ProfileOverviewTabs({
  hideActivityTab,
  overview,
  library,
  activity,
}: ProfileOverviewTabsProps) {
  const [value, setValue] = useState<ProfileTabValue>("overview");

  const options: ReadonlyArray<{ value: ProfileTabValue; label: string }> =
    hideActivityTab
      ? [
          { value: "overview", label: "Overview" },
          { value: "library", label: "Library" },
        ]
      : [
          { value: "overview", label: "Overview" },
          { value: "library", label: "Library" },
          { value: "activity", label: "Activity" },
        ];

  return (
    <div>
      {/* Sticky tab strip sits directly above content (AC PRO-1) */}
      <div
        data-testid="profile-tab-strip"
        className="bg-background/90 sticky top-0 z-10 px-4 py-2 backdrop-blur-sm md:px-6"
      >
        <SegmentedControl<ProfileTabValue>
          value={value}
          onValueChange={setValue}
          options={options}
          size="md"
          scrollable
          ariaLabel="Profile sections"
        />
      </div>
      <div role="tabpanel" className="px-4 py-4 md:px-6">
        {value === "overview" ? overview : null}
        {value === "library" ? library : null}
        {value === "activity" && !hideActivityTab ? activity : null}
      </div>
    </div>
  );
}
