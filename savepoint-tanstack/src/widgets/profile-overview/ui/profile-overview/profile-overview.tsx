import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";

import { getDisplayName } from "@/entities/profile/model";
import { AvatarUpload } from "@/features/upload-avatar";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { GameCover } from "@/shared/ui/game-cover";
import { PageHeader } from "@/shared/ui/page-header";
import { SectionLabel } from "@/shared/ui/section-label";
import { SegmentedControl } from "@/shared/ui/segmented-control";

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
  hideActivityTab = false,
}: ProfileOverviewProps) {
  const displayName = getDisplayName(profile, "User");
  const avatarSrc = profile.image ?? DEFAULT_AVATAR_SRC;

  const { want, playing, done } = stats;
  const gameCount = want + playing + done;

  const inlineStats = [
    { label: "in library", value: gameCount },
    { label: "want", value: want },
    { label: "playing", value: playing },
    { label: "done", value: done },
    { label: "notes", value: stats.journalCount ?? 0 },
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
          className="relative h-20 w-full bg-gradient-to-br from-accent to-muted md:h-36"
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
                className="h-20 w-20 rounded-full object-cover ring-4 ring-background md:h-28 md:w-28"
              />
              {isOwnProfile ? (
                <div className="absolute inset-x-0 bottom-0 rounded-b-full bg-scrim/60 px-2 py-1 text-center text-xs text-scrim-foreground">
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
          <PageHeader
            title={displayName}
            sub={profile.username ? `@${profile.username}` : undefined}
            className="mb-0"
          />

          {/* Follower / following counts */}
          {profile.username &&
          followerCount !== undefined &&
          followingCount !== undefined ? (
            <p
              className="mt-1 flex flex-wrap items-center text-sm text-muted-foreground"
              data-testid="profile-social-counts"
            >
              <Link
                to="/u/$username/followers"
                params={{ username: profile.username }}
                className="-my-3 inline-flex min-h-11 items-center transition-colors hover:text-foreground md:my-0 md:min-h-0"
              >
                <span>
                  <span className="font-medium text-foreground tabular-nums">
                    {followerCount}
                  </span>{" "}
                  Followers
                </span>
              </Link>
              <span aria-hidden="true" className="mx-1">
                ·
              </span>
              <Link
                to="/u/$username/following"
                params={{ username: profile.username }}
                className="-my-3 inline-flex min-h-11 items-center transition-colors hover:text-foreground md:my-0 md:min-h-0"
              >
                <span>
                  <span className="font-medium text-foreground tabular-nums">
                    {followingCount}
                  </span>{" "}
                  Following
                </span>
              </Link>
            </p>
          ) : null}

          {/* Compact inline stat row (AC PRO-1) */}
          <div data-testid="profile-stat-row" className="mt-3 flex gap-5">
            {inlineStats.map(({ label, value }) => (
              <div key={label} data-testid="profile-stat-item">
                <span className="text-base font-bold text-foreground tabular-nums">
                  {value}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {label}
                </span>
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
                <SectionLabel className="mb-4">Playing</SectionLabel>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
                  {stats.recentGames.map((game) => (
                    <Link
                      key={game.gameId}
                      to="/games/$slug"
                      params={{ slug: game.slug }}
                      className="group relative block overflow-hidden rounded-lg"
                      data-testid="overview-recently-played-entry"
                    >
                      <GameCover src={game.coverImage} name={game.title} />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-scrim/90 via-scrim/40 to-transparent"
                      />
                      <div className="absolute inset-x-0 bottom-0 space-y-0.5 p-2 text-scrim-foreground">
                        <span className="line-clamp-2 block text-xs leading-tight font-medium">
                          {game.title}
                        </span>
                        <span className="block text-xs text-scrim-foreground/80">
                          {formatRelativeTime(new Date(game.lastPlayed))}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
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
              description="Activity will appear here once notes and library changes are tracked publicly."
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
      <div className={cn("flex gap-2", className)}>
        <Link
          to="/settings/profile"
          className={cn(buttonVariants({ variant: "outline" }), "flex-1")}
        >
          Edit Profile
        </Link>
        <Link
          to="/settings"
          className={cn(buttonVariants({ variant: "outline" }), "flex-1")}
        >
          Settings
        </Link>
      </div>
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
        className="sticky top-0 z-10 bg-background/90 px-4 py-2 backdrop-blur-sm md:px-6"
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
