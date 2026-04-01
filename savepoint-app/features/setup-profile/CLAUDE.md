# Feature: setup-profile

First-time profile setup flow for new users after registration.

## Structure

- `server-actions/` -- complete setup, skip setup, avatar upload
- `ui/` -- profile setup form

## Notes

- Imports UI components from `profile` feature (AvatarUpload, UsernameInput)
- Thin feature; most logic delegates to `profile` server actions
