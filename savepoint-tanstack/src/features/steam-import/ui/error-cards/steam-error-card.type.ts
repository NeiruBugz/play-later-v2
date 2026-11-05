/**
 * Shared prop shape for the Steam error-state cards.
 *
 * The 3 typed-error cards (`SteamPrivacyErrorCard`,
 * `SteamApiUnavailableErrorCard`, `SteamRateLimitErrorCard`) accept the same `{ message, onRetry? }` shape.
 * Lives alongside the cards because the type axis is the variant identity.
 */
export type SteamErrorCardProps = {
  /** Human-readable copy. Typically `err.message` from the typed Steam error. */
  message: string;
  /** Optional retry handler — when omitted, the "Try Again" button is hidden. */
  onRetry?: () => void;
};
