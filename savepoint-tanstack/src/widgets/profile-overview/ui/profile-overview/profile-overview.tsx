import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  CircleCheck,
  Gamepad2,
  Notebook,
  Trophy,
} from "lucide-react";
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
  const playing = stats.statusCounts.PLAYING ?? 0;
  // "Played" and "Completed" are different things and must not be conflated.
  // PLAYED is a status (started, then set aside or finished — includes dropped
  // games). Completion is a timestamp (`completedAt IS NOT NULL`). There is no
  // COMPLETED status enum, so the old `statusCounts.COMPLETED` read was a
  // phantom that always fell through to PLAYED and mislabeled it "Completed".
  const played = stats.statusCounts.PLAYED ?? 0;
  const completed = stats.completedCount ?? 0;

  const statCards: ReadonlyArray<{
    label: string;
    value: number;
    icon: typeof BookOpen;
  }> = [
    { label: "In Library", value: gameCount, icon: BookOpen },
    { label: "Playing", value: playing, icon: Gamepad2 },
    { label: "Played", value: played, icon: CircleCheck },
    { label: "Completed", value: completed, icon: Trophy },
    {
      label: "Journal Entries",
      value: stats.journalCount ?? 0,
      icon: Notebook,
    },
  ];

  return (
    <div className="space-y-8">
      <header data-testid="profile-hero">
        <div
          data-testid="profile-hero-banner"
          aria-hidden="true"
          className="relative h-20 w-full rounded-lg sm:h-[120px]"
          style={{ background: deriveBannerGradient(usernameSlug) }}
        />
        <div className="relative px-4 sm:px-6">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative inline-block">
                <img
                  src={avatarSrc}
                  alt={displayName}
                  width={140}
                  height={140}
                  className="ring-background h-20 w-20 rounded-lg object-cover ring-4 sm:h-[140px] sm:w-[140px]"
                />
                {isOwnProfile ? (
                  <div className="absolute inset-x-0 bottom-0 rounded-b-lg bg-black/60 px-2 py-1 text-center text-xs text-white">
                    <AvatarUpload label="Change avatar" />
                  </div>
                ) : null}
              </div>
              <div className="space-y-1 pb-1">
                <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
                  {displayName}
                </h1>
                {profile.username ? (
                  <p className="text-caption text-muted-foreground">
                    @{profile.username}
                  </p>
                ) : null}
                {/* Follower / following counts. Slice 20: links to
                    `/u/$username/followers` and `/u/$username/following`
                    when a username is present; degrade to plain text
                    otherwise. Counts are optional — when omitted, the row
                    is hidden entirely (tests, mocks). */}
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
              </div>
            </div>
            {headerActions !== undefined ? (
              <div className="shrink-0" data-testid="profile-header-actions">
                {headerActions}
              </div>
            ) : isOwnProfile ? (
              <div className="shrink-0">
                <Button asChild variant="outline">
                  <Link to="/settings/profile">Edit Profile</Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Sub-tabs — SegmentedControl driving conditional content per Slice 22
          drift-fix (canonical uses SegmentedControl, not a Radix Tabs strip).
          SegmentedControl is built on @radix-ui/react-tabs so triggers expose
          role="tab" and the active panel reads as a Radix TabsContent. */}
      <ProfileOverviewTabs
        hideActivityTab={hideActivityTab}
        overview={
          <div className="space-y-8">
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
              data-testid="profile-stats-bar"
            >
              {statCards.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="bg-card text-card-foreground rounded-lg border p-4"
                  data-testid="profile-stats-bar-item"
                >
                  <Icon
                    aria-hidden="true"
                    className="text-muted-foreground mb-2 h-5 w-5"
                  />
                  <p className="text-2xl font-semibold tabular-nums">{value}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs font-medium">
                    {label}
                  </p>
                </div>
              ))}
            </div>

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
                      {/* Gradient mask for legibility */}
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
          // Slice 22: render the owner's read-only library grid (canonical
          // `/u/[username]/library` renders `LibraryGrid`). The route injects
          // the resolved grid via `librarySlot`; fall back to an empty state
          // when omitted (tests/mocks) or when the owner has no games.
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
    <div className="space-y-6">
      <SegmentedControl<ProfileTabValue>
        value={value}
        onValueChange={setValue}
        options={options}
        size="md"
        scrollable
        ariaLabel="Profile sections"
      />
      <div role="tabpanel">
        {value === "overview" ? overview : null}
        {value === "library" ? library : null}
        {value === "activity" && !hideActivityTab ? activity : null}
      </div>
    </div>
  );
}
