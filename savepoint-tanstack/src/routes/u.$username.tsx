import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { LibraryGrid } from "@/entities/library-item/ui";
import { getCurrentUserFn } from "@/entities/session/api/get-current-user";
import { FollowUserButton } from "@/features/follow-user";
import { getPublicProfilePageDataFn } from "@/features/profile-overview/api";
import { UnfollowUserButton } from "@/features/unfollow-user";
import {
  getActivityFeedFn,
  getActivityForUserFn,
} from "@/features/view-activity-feed/api";
import { NotFoundError } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";
import { ProfileActivityTab, ProfileOverview } from "@/widgets";

/**
 * Public profile route.
 *
 * Loader fetches the public profile + library stats via the privacy-aware
 * `getPublicProfile` entity query (throws `NotFoundError` for both "missing"
 * and "private"). We also fetch the optional viewer so the widget can
 * decide whether to show the owner-only "Edit Profile" / "Change avatar"
 * affordances.
 *
 * Slice 20 additions:
 *   - follower / following counts + isFollowing live on the page data.
 *   - signed-in non-owner viewer sees a follow/unfollow CTA in the header.
 *   - activity tab content is fetched server-side (per-user public stream
 *     for other-users; viewer's own follow-graph feed for own-profile).
 *   - anonymous viewers don't see the activity tab.
 */
export const Route = createFileRoute("/u/$username")({
  loader: async ({ params }) => {
    try {
      const [pageData, viewer] = await Promise.all([
        getPublicProfilePageDataFn({ data: { username: params.username } }),
        getCurrentUserFn(),
      ]);
      const viewerId = viewer.user?.id ?? null;
      const isOwnProfile =
        viewerId !== null && viewerId === pageData.profile.id;

      const activity = viewerId
        ? isOwnProfile
          ? await getActivityFeedFn({ data: {} })
          : await getActivityForUserFn({
              data: { targetUserId: pageData.profile.id },
            })
        : null;

      return { ...pageData, viewerId, activity };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw notFound();
      }
      throw error;
    }
  },
  component: PublicProfilePage,
  notFoundComponent: ProfileNotFound,
});

function PublicProfilePage() {
  const {
    profile,
    stats,
    viewerId,
    followerCount,
    followingCount,
    isFollowing,
    libraryItems = [],
    activity,
  } = Route.useLoaderData();
  const isOwnProfile = viewerId != null && viewerId === profile.id;

  // Decide which CTA to inject into the header. Anonymous viewers and the
  // own-profile case → none (own-profile falls back to the widget's
  // built-in "Edit Profile" button via the absence of `headerActions`).
  let headerActions: React.ReactNode | undefined;
  if (viewerId !== null && !isOwnProfile && profile.username) {
    headerActions = isFollowing ? (
      <UnfollowUserButton
        profileUserId={profile.id}
        profileUsername={profile.username}
        viewerUserId={viewerId}
        isFollowing={true}
      />
    ) : (
      <FollowUserButton
        profileUserId={profile.id}
        profileUsername={profile.username}
        viewerUserId={viewerId}
        isFollowing={false}
      />
    );
  }

  // Library tab content — read-only grid of the profile owner's public
  // library (canonical `/u/[username]/library`). When the owner has no games,
  // leave the slot undefined so the widget shows its built-in empty state.
  const librarySlot =
    libraryItems.length > 0 ? <LibraryGrid games={libraryItems} /> : undefined;

  // Activity tab content. The route owns the choice of loader (own vs
  // per-user) and the "Load more" fetcher. Anonymous viewers don't see the
  // tab at all (locked decision — hidden, not disabled).
  const activitySlot =
    activity !== null ? (
      <ProfileActivityTab
        initialItems={activity.items}
        initialNextCursor={activity.nextCursor}
        loadMore={async (cursor) =>
          isOwnProfile
            ? await getActivityFeedFn({ data: { cursor } })
            : await getActivityForUserFn({
                data: { targetUserId: profile.id, cursor },
              })
        }
      />
    ) : undefined;

  return (
    <main className="container mx-auto px-4 py-6">
      <ProfileOverview
        profile={profile}
        stats={stats}
        isOwnProfile={isOwnProfile}
        followerCount={followerCount}
        followingCount={followingCount}
        headerActions={headerActions}
        librarySlot={librarySlot}
        activitySlot={activitySlot}
        hideActivityTab={viewerId === null}
      />
    </main>
  );
}

function ProfileNotFound() {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="heading-lg mb-2">Profile not found</h1>
      <p className="text-muted-foreground mb-6">
        We couldn't find that profile, or it isn't public.
      </p>
      <Button asChild variant="outline">
        <Link to="/">Go home</Link>
      </Button>
    </main>
  );
}
