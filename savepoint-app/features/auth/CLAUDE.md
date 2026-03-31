# Feature: auth

Authentication flow (sign-in, sign-up, Google OAuth). Provides credential forms and server actions for session management.

## Structure

- `server-actions/` -- sign-in, sign-up, Google sign-in
- `ui/` -- auth page view, credentials form, Google button
- `schemas.ts` -- Zod schemas for auth validation

## Notes

- No cross-feature imports; self-contained
- Dual barrel exports: `index.ts` (client) and `index.server.ts` (server)
