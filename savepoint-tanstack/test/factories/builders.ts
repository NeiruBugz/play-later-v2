import type {
  Game,
  JournalEntry,
  LibraryItem,
  Playthrough,
} from "../../shared/lib/prisma/client.ts";
import { nextSequence } from "./sequence.ts";

const FIXED_DATE = new Date("2025-01-01T00:00:00.000Z");

export type LibraryItemWithGame = LibraryItem & {
  game: Pick<
    Game,
    | "id"
    | "igdbId"
    | "title"
    | "slug"
    | "coverImage"
    | "releaseDate"
    | "timeToCreditsSeconds"
    | "coverHue"
    | "coverChroma"
    | "releaseDatePrecision"
    | "releaseDateMovedFrom"
    | "releaseDateMovedAt"
  >;
};

export function buildGame(overrides: Partial<Game> = {}): Game {
  const n = nextSequence();
  return {
    id: `game-${n}`,
    igdbId: 100_000 + n,
    title: `Test Game ${n}`,
    description: null,
    coverImage: null,
    releaseDate: null,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    steamAppId: null,
    slug: `test-game-${n}`,
    franchiseId: null,
    timeToCreditsSeconds: null,
    timeToCompleteSeconds: null,
    timesToBeatFetchedAt: null,
    coverHue: null,
    coverChroma: null,
    coverTintComputedAt: null,
    releaseDatePrecision: null,
    releaseDateCheckedAt: null,
    releaseDateMovedFrom: null,
    releaseDateMovedAt: null,
    ...overrides,
  };
}

export function buildLibraryItem(
  overrides: Partial<LibraryItem> = {}
): LibraryItem {
  const n = nextSequence();
  return {
    id: n,
    status: "WANT",
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    statusChangedAt: null,
    platform: null,
    userId: "user-1",
    acquisitionType: "DIGITAL",
    gameId: `game-${n}`,
    startedAt: null,
    completedAt: null,
    hasBeenPlayed: false,
    rating: null,
    statusIsManual: false,
    upNextPosition: null,
    isOwned: true,
    doneOutcome: null,
    whyPromptDismissedAt: null,
    stayedPromptDismissedAt: null,
    ...overrides,
  };
}

export function buildLibraryItemWithGame(
  overrides: Partial<LibraryItem> = {},
  game: Partial<Game> = {}
): LibraryItemWithGame {
  const {
    id,
    igdbId,
    title,
    slug,
    coverImage,
    releaseDate,
    timeToCreditsSeconds,
    coverHue,
    coverChroma,
    releaseDatePrecision,
    releaseDateMovedFrom,
    releaseDateMovedAt,
  } = buildGame(game);
  return {
    ...buildLibraryItem({ gameId: id, ...overrides }),
    game: {
      id,
      igdbId,
      title,
      slug,
      coverImage,
      releaseDate,
      timeToCreditsSeconds,
      coverHue,
      coverChroma,
      releaseDatePrecision,
      releaseDateMovedFrom,
      releaseDateMovedAt,
    },
  };
}

export function buildPlay(overrides: Partial<Playthrough> = {}): Playthrough {
  const n = nextSequence();
  return {
    id: `play-${n}`,
    libraryItemId: 1,
    ordinal: 1,
    kind: "FIRST",
    status: "PLAYING",
    platform: null,
    startedAt: FIXED_DATE,
    finishedAt: null,
    playtimeMinutes: 0,
    rating: null,
    completion: null,
    notes: null,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  };
}

export function buildNote(overrides: Partial<JournalEntry> = {}): JournalEntry {
  const n = nextSequence();
  return {
    id: `note-${n}`,
    kind: "QUICK",
    title: null,
    content: `Test note ${n}`,
    playedMinutes: null,
    tags: [],
    mood: null,
    playSession: null,
    visibility: "PRIVATE",
    prompt: null,
    userId: "user-1",
    gameId: null,
    libraryItemId: null,
    playthroughId: null,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    publishedAt: null,
    ...overrides,
  };
}
