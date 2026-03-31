# Feature: profile

User profile management: avatar upload, username editing, profile stats, and settings form.

## Structure

- `hooks/` -- username validation
- `lib/` -- constants, schemas, validation, data preparation
- `server-actions/` -- update profile, upload avatar, check username availability
- `ui/` -- avatar upload, username input, settings form, profile view, stats bar

## Notes

- Exports UI components (`AvatarUpload`, `UsernameInput`) for `setup-profile` to reuse
- Profile lib and server actions migrated here from `shared/`
