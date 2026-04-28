# Feature: profile

User profile management: avatar upload, username editing, profile stats, and settings form.

## Structure

- `hooks/` -- `useUsernameValidation`
- `lib/` -- constants, schemas, validation, data preparation
- `server-actions/` -- update profile, upload avatar, check username availability
- `ui/` -- profile page sections, form inputs, settings, activity log

## Public API (`index.ts`)

High-level groups exported from the barrel — see `index.ts` for the full list:

- Page sections: `ProfileHeader`, `ProfileStatsBar`, `ProfileTabNav`, `OverviewTab`, `ActivityLog`, `LibraryGrid`, `RatingHistogram`, `ProfilePrivateMessage`
- Form / settings inputs: `AvatarUpload`, `UsernameInput`, `ProfileSettingsForm`, `ProfileVisibilityToggle`, `LogoutButton`
- Hooks: `useUsernameValidation`
- Types: `RecentGame`, `LibraryStats`, `ProfileWithStats`, `UpdateProfileFormState`, plus per-component prop types

## Notes

- Exports UI components (`AvatarUpload`, `UsernameInput`) for `setup-profile` to reuse
- Imports `FollowButton` from `social` (authorized — see `features/CLAUDE.md` allowlist)
- Profile lib and server actions migrated here from `shared/`
