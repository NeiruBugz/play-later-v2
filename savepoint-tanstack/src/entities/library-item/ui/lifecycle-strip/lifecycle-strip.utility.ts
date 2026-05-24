import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";

const MILLISECONDS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const DAYS_AS_WEEKS_THRESHOLD = 14;
const RELATIVE_DAY_CAP = 60;

export type LifecycleTone = "playing" | "completed" | "idle";

export type LifecycleStripInput = {
  status: LibraryItemStatus;
  createdAt: Date | string;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  now?: Date;
};

/**
 * View-model for the lifecycle strip. The strip is a *time arc* across the
 * span the item has been owned (createdAt → now), not a completion percentage
 * — SavePoint stores only timestamps, never a progress fraction. The filled
 * segment marks the active play window (startedAt → completedAt | now); the
 * marker is the moment play began.
 */
export type LifecycleStripModel = {
  addedLabel: string;
  endLabel: string;
  startMarkerPct: number | null;
  fillStartPct: number;
  fillEndPct: number;
  tone: LifecycleTone;
  hoverTitle: string;
};

function toDate(value: Date | string | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function clampPct(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function formatFull(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function compactElapsed(date: Date, now: Date): string {
  const days = Math.max(
    0,
    Math.round((now.getTime() - date.getTime()) / MILLISECONDS_PER_DAY)
  );
  if (days < DAYS_AS_WEEKS_THRESHOLD) return `${days}d`;
  if (days < RELATIVE_DAY_CAP) return `${Math.round(days / DAYS_PER_WEEK)}w`;
  return `${Math.round(days / DAYS_PER_MONTH)}mo`;
}

export function computeLifecycleStrip(
  input: LifecycleStripInput
): LifecycleStripModel {
  const now = input.now ?? new Date();
  const created = toDate(input.createdAt) ?? now;
  const started = toDate(input.startedAt);
  const completed = toDate(input.completedAt);

  const total = Math.max(now.getTime() - created.getTime(), 1);
  const pct = (date: Date) =>
    clampPct(((date.getTime() - created.getTime()) / total) * 100);

  const startMarkerPct = started ? pct(started) : null;

  let fillStartPct = 0;
  let fillEndPct = 0;
  let tone: LifecycleTone = "idle";

  if (completed) {
    fillStartPct = started ? pct(started) : 0;
    fillEndPct = Math.max(pct(completed), fillStartPct);
    tone = "completed";
  } else if (input.status === "PLAYING") {
    fillStartPct = started ? pct(started) : 0;
    fillEndPct = 100;
    tone = "playing";
  }

  let endLabel: string;
  if (completed) {
    endLabel = `done ${compactElapsed(completed, now)}`;
  } else if (started) {
    endLabel = `started ${compactElapsed(started, now)}`;
  } else {
    endLabel = "—";
  }

  const hoverParts = [`Added ${formatFull(created)}`];
  if (started) hoverParts.push(`Started ${formatFull(started)}`);
  if (completed) hoverParts.push(`Completed ${formatFull(completed)}`);

  return {
    addedLabel: `added ${compactElapsed(created, now)}`,
    endLabel,
    startMarkerPct,
    fillStartPct,
    fillEndPct,
    tone,
    hoverTitle: hoverParts.join(" · "),
  };
}
