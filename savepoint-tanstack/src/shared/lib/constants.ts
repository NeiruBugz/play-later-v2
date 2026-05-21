export const RECENT_GAMES_LIMIT = 5;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 25;
export const USERNAME_VALIDATION_DEBOUNCE_MS = 500;

/**
 * Suggested-username max length used when slugifying the user's display name
 * for the first-run profile-setup page. Mirrors `SUGGESTED_USERNAME_MAX_LENGTH`
 * in `savepoint-app/shared/constants/validation.ts`.
 */
export const SUGGESTED_USERNAME_MAX_LENGTH = 20;

/**
 * Window after sign-up during which a user is still considered "new" and is
 * shown the profile-setup page even if a username already exists. Mirrors
 * `NEW_USER_THRESHOLD_MS` in `savepoint-app/shared/constants/time.ts`.
 */
export const NEW_USER_THRESHOLD_MS = 5 * 60 * 1000;
