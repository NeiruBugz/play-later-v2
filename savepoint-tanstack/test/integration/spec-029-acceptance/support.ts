import { vi } from "vitest";

import { igdbFetch } from "@/shared/api/igdb/fetch";

import {
  createGame,
  createLibraryItem,
  type FactoryDb,
} from "../../factories/index.ts";
import type { IsolatedDatabase } from "../../setup/isolated-db.ts";

export const SPEC_TAG = "@spec: 029-release-days";

export const NOW = new Date("2026-11-12T12:00:00Z");
export const TODAY = "2026-11-12";

const MILLISECONDS_PER_DAY = 86_400_000;
const SECONDS_PER_DAY = 86_400;

export type ReleaseState = {
  releaseDate: Date | null;
  releaseDatePrecision: "DAY" | "MONTH" | "QUARTER" | "YEAR" | "TBA" | null;
  releaseDateCheckedAt?: Date | null;
  releaseDateMovedFrom?: Date | null;
  releaseDateMovedAt?: Date | null;
};

export const utcMidnight = (day: string) => new Date(`${day}T00:00:00Z`);

export const dayFromToday = (offsetDays: number): string =>
  new Date(NOW.getTime() + offsetDays * MILLISECONDS_PER_DAY)
    .toISOString()
    .slice(0, 10);

export const daysBeforeNow = (days: number) =>
  new Date(NOW.getTime() - days * MILLISECONDS_PER_DAY);

export const exactDay = (
  day: string,
  extra: Partial<ReleaseState> = {}
): ReleaseState => ({
  releaseDate: utcMidnight(day),
  releaseDatePrecision: "DAY",
  ...extra,
});

export const vagueDay = (
  periodStart: string,
  precision: "MONTH" | "QUARTER" | "YEAR",
  extra: Partial<ReleaseState> = {}
): ReleaseState => ({
  releaseDate: utcMidnight(periodStart),
  releaseDatePrecision: precision,
  ...extra,
});

export const toBeAnnounced: ReleaseState = {
  releaseDate: null,
  releaseDatePrecision: "TBA",
};

export const noDateAtAll: ReleaseState = {
  releaseDate: null,
  releaseDatePrecision: null,
};

export function freezeTimeAt(now: Date = NOW): void {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(now);
}

export function unfreezeTime(): void {
  vi.useRealTimers();
}

export async function wipeAllTables(db: IsolatedDatabase): Promise<void> {
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.playthrough.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
}

type SeedGameOptions = {
  title: string;
  release: ReleaseState;
  status?: "WANT" | "PLAYING" | "DONE";
  isOwned?: boolean;
  igdbId?: number;
};

export async function seedLibraryGame(
  db: FactoryDb,
  userId: string,
  { title, release, status = "WANT", isOwned = true, igdbId }: SeedGameOptions
) {
  const game = await createGame(db, {
    title,
    slug: title.toLowerCase().replaceAll(" ", "-"),
    ...(igdbId === undefined ? {} : { igdbId }),
    ...release,
  });
  const item = await createLibraryItem(db, {
    userId,
    gameId: game.id,
    status,
    isOwned,
  });
  return { game, item };
}

export const igdbFetchMock = igdbFetch as ReturnType<typeof vi.fn>;

type IgdbGame = Record<string, unknown> & { id: number };

const toUnixSeconds = (day: string) =>
  utcMidnight(day).getTime() / MILLISECONDS_PER_DAY / 1 &&
  Math.floor(utcMidnight(day).getTime() / 1000);

export const igdbReportsExactDay = (igdbId: number, day: string): IgdbGame => ({
  id: igdbId,
  first_release_date: toUnixSeconds(day),
  release_dates: [{ date: toUnixSeconds(day), date_format: 0 }],
});

export const igdbReportsYear = (igdbId: number, year: number): IgdbGame => {
  const lastDayOfYear = toUnixSeconds(`${year}-12-31`);
  return {
    id: igdbId,
    first_release_date: lastDayOfYear,
    release_dates: [{ date: lastDayOfYear, date_format: 2, y: year, m: 12 }],
  };
};

export const igdbReportsToBeAnnounced = (igdbId: number): IgdbGame => ({
  id: igdbId,
  release_dates: [{ date_format: 7 }],
});

export function igdbAnswers(gamesById: Record<number, IgdbGame>): void {
  igdbFetchMock.mockImplementation((_resource: string, query: string) => {
    const askedIds = (/where id = \(([^)]*)\)/.exec(query)?.[1] ?? "")
      .split(",")
      .map((id) => Number(id.trim()));
    return Promise.resolve(
      askedIds.flatMap((id) => (id in gamesById ? [gamesById[id]] : []))
    );
  });
}

export const igdbIdsAskedAbout = (): number[] =>
  igdbFetchMock.mock.calls.flatMap(([, query]: unknown[]) =>
    (/where id = \(([^)]*)\)/.exec(String(query))?.[1] ?? "")
      .split(",")
      .map((id) => Number(id.trim()))
  );

export { SECONDS_PER_DAY };
