import type {
  Game,
  JournalEntry,
  LibraryItem,
  Playthrough,
  Prisma,
  PrismaClient,
  user as User,
} from "../../shared/lib/prisma/client.ts";
import { nextSequence } from "./sequence.ts";

export type FactoryDb = Pick<
  PrismaClient,
  "user" | "game" | "libraryItem" | "playthrough" | "journalEntry"
>;

export async function createUser(
  db: FactoryDb,
  overrides: Partial<Prisma.userUncheckedCreateInput> = {}
): Promise<User> {
  const n = nextSequence();
  return db.user.create({
    data: {
      id: `factory-user-${n}`,
      email: `factory-user-${n}@example.com`,
      name: `Factory User ${n}`,
      emailVerified: true,
      username: `factoryuser${n}`,
      usernameNormalized: `factoryuser${n}`,
      isPublicProfile: false,
      ...overrides,
    },
  });
}

export async function createGame(
  db: FactoryDb,
  overrides: Partial<Prisma.GameUncheckedCreateInput> = {}
): Promise<Game> {
  const n = nextSequence();
  return db.game.create({
    data: {
      igdbId: 100_000 + n,
      title: `Factory Game ${n}`,
      slug: `factory-game-${n}`,
      ...overrides,
    },
  });
}

type CreateLibraryItemOverrides = Omit<
  Prisma.LibraryItemUncheckedCreateInput,
  "userId" | "gameId"
> & {
  userId: string;
  gameId: string;
  withOpenPlay?: boolean;
};

export async function createLibraryItem(
  db: FactoryDb,
  overrides: CreateLibraryItemOverrides
): Promise<LibraryItem> {
  const { withOpenPlay = true, ...data } = overrides;
  const item = await db.libraryItem.create({
    data: { status: "WANT", isOwned: true, ...data },
  });
  if (item.status === "PLAYING" && withOpenPlay) {
    await createPlay(db, { libraryItemId: item.id });
  }
  return item;
}

export async function createPlay(
  db: FactoryDb,
  overrides: Partial<Prisma.PlaythroughUncheckedCreateInput> & {
    libraryItemId: number;
  }
): Promise<Playthrough> {
  const { libraryItemId } = overrides;
  const existing = await db.playthrough.count({ where: { libraryItemId } });
  const ended = overrides.finishedAt != null;
  return db.playthrough.create({
    data: {
      ordinal: existing + 1,
      kind: existing === 0 ? "FIRST" : "REPLAY",
      status: ended ? "FINISHED" : "PLAYING",
      startedAt: new Date("2025-01-01T00:00:00.000Z"),
      ...overrides,
    },
  });
}

export async function createNote(
  db: FactoryDb,
  overrides: Partial<Prisma.JournalEntryUncheckedCreateInput> & {
    userId: string;
  }
): Promise<JournalEntry> {
  const n = nextSequence();
  return db.journalEntry.create({
    data: { content: `Factory note ${n}`, ...overrides },
  });
}
