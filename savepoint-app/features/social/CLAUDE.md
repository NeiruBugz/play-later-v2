# Social Feature

Social engagement — follow system, activity feed, public profile interactions.

## Segments

- `ui/` — FollowButton, ActivityFeed, FollowersList, etc.
- `hooks/` — useFollow, useActivityFeed
- `server-actions/` — follow/unfollow mutations
- `types.ts` — shared social feature types

## Non-Obvious Context

- Uses split barrel exports: `index.ts` (client-safe) and `index.server.ts` (async RSC components)
- ActivityFeed is a hybrid: RSC for initial render, client infinite scroll for pagination
- Cross-feature dependency: `profile/ui/` imports FollowButton from `social`
