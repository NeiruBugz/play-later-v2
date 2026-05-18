/**
 * Card-local helpers — status-driven contextual date string + primary-CTA
 * payload. Mirrors the canonical shapes at
 * `savepoint-app/features/library/ui/library-card-metadata.tsx` and
 * `library/lib/library-card-cta-payload.ts` so the visual surface matches
 * the audit reference. Reusing them across the widget is the whole reason
 * they live in a `.utility.ts` rather than the component body.
 */

import type { LibraryItemWithGame } from "@/entities/library-item/model";

// Local alias avoids dragging a deep prisma-client import into a widget
// (would also dirty the FSD layer story). The entity model already
// re-exports the shape we care about via `LibraryItemWithGame.status`.
type LibraryItemStatus = LibraryItemWithGame["status"];

const MILLISECONDS_PER_DAY = 86_400_000;
const ABSOLUTE_THRESHOLD_DAYS = 60;

function toDate(value: Date | string | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Short relative-date formatter (`"yesterday"`, `"11 days ago"`,
 * `"May 4, 2026"` past 60 days). Uses `Intl.RelativeTimeFormat` — same
 * approach as `widgets/profile-overview/lib/format-relative-time.ts`;
 * `date-fns` is intentionally not a tanstack dependency.
 */
export function formatRelativeDate(date: Date, now: Date = new Date()): string {
  const diffDays = Math.round(
    (now.getTime() - date.getTime()) / MILLISECONDS_PER_DAY
  );

  if (Math.abs(diffDays) > ABSOLUTE_THRESHOLD_DAYS) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  }

  return new Intl.RelativeTimeFormat("en-US", { numeric: "auto" }).format(
    -diffDays,
    "day"
  );
}

export type ContextualDateInput = {
  status: LibraryItemStatus;
  startedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
};

/**
 * Pick the "right" date string for a status:
 *  - PLAYING / UP_NEXT → started or added
 *  - PLAYED            → finished (updatedAt) or added
 *  - SHELF / WISHLIST  → added
 */
export function getContextualDate(input: ContextualDateInput): string | null {
  const { status, startedAt, createdAt, updatedAt } = input;
  const created = toDate(createdAt);
  const started = toDate(startedAt);
  const updated = toDate(updatedAt);

  if (status === "PLAYING" || status === "UP_NEXT") {
    if (started) return `Started ${formatRelativeDate(started)}`;
    if (created) return `Added ${formatRelativeDate(created)}`;
    return null;
  }
  if (status === "PLAYED") {
    if (updated) return `Finished ${formatRelativeDate(updated)}`;
    if (created) return `Added ${formatRelativeDate(created)}`;
    return null;
  }
  if (created) return `Added ${formatRelativeDate(created)}`;
  return null;
}

/**
 * Contextual primary-CTA payload — matches the canonical mapping at
 * `savepoint-app/features/library/lib/library-card-cta-payload.ts`.
 *
 * - PLAYING → "Log Session" → opens a journal-compose dialog
 * - All others → updates the library status
 */
export type CardCtaAction =
  | { kind: "logSession" }
  | {
      kind: "updateStatus";
      status: LibraryItemStatus;
      hasBeenPlayed?: boolean;
      startedAtNullableSet?: boolean;
    };

export type CardCtaPayload = { label: string; action: CardCtaAction };

export function getPrimaryCtaPayload(
  status: LibraryItemStatus
): CardCtaPayload {
  switch (status) {
    case "PLAYING":
      return { label: "Log Session", action: { kind: "logSession" } };
    case "UP_NEXT":
      return {
        label: "Start Playing",
        action: {
          kind: "updateStatus",
          status: "PLAYING",
          startedAtNullableSet: true,
        },
      };
    case "SHELF":
      return {
        label: "Queue It",
        action: { kind: "updateStatus", status: "UP_NEXT" },
      };
    case "PLAYED":
      return {
        label: "Replay",
        action: {
          kind: "updateStatus",
          status: "UP_NEXT",
          hasBeenPlayed: true,
        },
      };
    case "WISHLIST":
      return {
        label: "Add to Shelf",
        action: { kind: "updateStatus", status: "SHELF" },
      };
    default: {
      // Exhaustiveness assertion — raw throw is allowed for defensive
      // invariant checks per `errors.md`.
      const _exhaustive: never = status;
      throw new Error(`Unknown library status: ${String(_exhaustive)}`);
    }
  }
}
