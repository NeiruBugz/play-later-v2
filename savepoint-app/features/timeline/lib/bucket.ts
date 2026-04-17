import type { JournalEntry } from "@prisma/client";

export type TimelineQuickGroup = {
  kind: "quick-group";
  gameId: string;
  weekKey: string;
  entries: JournalEntry[];
  totalMinutes: number;
  latestAt: Date;
};

export type TimelineSingleEntry = {
  kind: "single";
  entry: JournalEntry;
  weekKey: string;
};

export type TimelineItem = TimelineQuickGroup | TimelineSingleEntry;

export type TimelineWeek = {
  weekKey: string;
  weekLabel: string;
  items: TimelineItem[];
};

/**
 * ISO week key in the form "YYYY-Www" (e.g. "2026-W16"). Weeks begin on
 * Monday, matching ISO-8601.
 */
export function getWeekKey(date: Date): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/**
 * Monday of the ISO week that contains `date`, in UTC.
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (dayNum - 1));
  return d;
}

export function formatWeekLabel(weekStart: Date): string {
  return `Week of ${weekStart.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })}`;
}

/**
 * Groups entries into weekly buckets. Within a week, multiple QUICK entries
 * for the same game collapse into a single TimelineQuickGroup; REFLECTION
 * entries (and singleton QUICK entries) render individually.
 */
export function bucketEntriesByWeek(entries: JournalEntry[]): TimelineWeek[] {
  const sorted = [...entries].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const byWeek = new Map<string, JournalEntry[]>();
  for (const entry of sorted) {
    const key = getWeekKey(entry.createdAt);
    const list = byWeek.get(key) ?? [];
    list.push(entry);
    byWeek.set(key, list);
  }

  const weeks: TimelineWeek[] = [];
  for (const [weekKey, weekEntries] of byWeek.entries()) {
    // Group QUICK entries by gameId within the week
    const quickByGame = new Map<string, JournalEntry[]>();
    const others: JournalEntry[] = [];
    for (const entry of weekEntries) {
      if (entry.kind === "QUICK" && entry.gameId) {
        const list = quickByGame.get(entry.gameId) ?? [];
        list.push(entry);
        quickByGame.set(entry.gameId, list);
      } else {
        others.push(entry);
      }
    }

    const items: TimelineItem[] = [];

    for (const [gameId, groupEntries] of quickByGame.entries()) {
      if (groupEntries.length >= 2) {
        const totalMinutes = groupEntries.reduce(
          (sum, e) => sum + (e.playedMinutes ?? 0),
          0
        );
        const latestAt = groupEntries.reduce<Date>(
          (latest, e) => (e.createdAt > latest ? e.createdAt : latest),
          groupEntries[0]!.createdAt
        );
        items.push({
          kind: "quick-group",
          gameId,
          weekKey,
          entries: groupEntries,
          totalMinutes,
          latestAt,
        });
      } else {
        for (const entry of groupEntries) {
          items.push({ kind: "single", entry, weekKey });
        }
      }
    }

    for (const entry of others) {
      items.push({ kind: "single", entry, weekKey });
    }

    // Sort items in the week by most-recent activity
    items.sort((a, b) => {
      const aDate = a.kind === "quick-group" ? a.latestAt : a.entry.createdAt;
      const bDate = b.kind === "quick-group" ? b.latestAt : b.entry.createdAt;
      return bDate.getTime() - aDate.getTime();
    });

    const sampleDate = weekEntries[0]!.createdAt;
    weeks.push({
      weekKey,
      weekLabel: formatWeekLabel(getWeekStart(sampleDate)),
      items,
    });
  }

  return weeks;
}

export function formatPlaytime(minutes: number): string {
  if (minutes === 0) return "";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (rem === 0) return `${hours}h`;
  return `${hours}h ${rem}m`;
}
