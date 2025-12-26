import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { Pool } from "pg";

let pool: Pool | undefined;
let prisma: PrismaClient | undefined;

function getPrisma(): PrismaClient {
  if (!prisma) {
    const connectionString = process.env.POSTGRES_PRISMA_URL;
    if (!connectionString) {
      throw new Error(
        "POSTGRES_PRISMA_URL environment variable is not set. Ensure test setup has configured environment variables before importing db helpers."
      );
    }
    pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}
export interface TestUser {
  id: string;
  email: string;
  username: string;
  password: string;
}
export async function createTestUser(data: {
  email: string;
  username: string;
  password: string;
}): Promise<TestUser> {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const email = data.email.trim().toLowerCase();
  const user = await getPrisma().user.create({
    data: {
      email: email,
      username: data.username,
      usernameNormalized: data.username.toLowerCase(),
      password: hashedPassword,
    },
  });
  return {
    id: user.id,
    email: user.email ?? email,
    username: user.username ?? data.username,
    password: data.password,
  };
}
export async function createTestUserWithoutUsername(data: {
  email: string;
  password: string;
  name?: string;
}): Promise<TestUser> {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const email = data.email.trim().toLowerCase();
  const user = await getPrisma().user.create({
    data: {
      email,
      password: hashedPassword,
      name: data.name ?? null,
    },
  });
  return {
    id: user.id,
    email: user.email ?? email,
    username: user.username ?? "",
    password: data.password,
  };
}
export async function deleteTestUser(email: string): Promise<void> {
  await getPrisma().user.delete({
    where: { email: email.trim().toLowerCase() },
  });
}
export async function deleteTestUsersByPattern(
  emailPattern: string
): Promise<void> {
  await getPrisma().user.deleteMany({
    where: {
      email: {
        contains: emailPattern,
      },
    },
  });
}
export async function getUserByEmail(email: string): Promise<{
  id: string;
  email: string | null;
  username: string | null;
} | null> {
  const user = await getPrisma().user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, email: true, username: true },
  });
  return user;
}
export async function clearTestData(): Promise<void> {
  const testUserPattern = {
    OR: [{ email: { contains: "test-" } }, { email: { contains: "e2e-" } }],
  };
  const client = getPrisma();
  await client.journalEntry.deleteMany({
    where: {
      user: testUserPattern,
    },
  });
  await client.review.deleteMany({
    where: {
      User: testUserPattern,
    },
  });
  await client.importedGame.deleteMany({
    where: {
      User: testUserPattern,
    },
  });
  await client.ignoredImportedGames.deleteMany({
    where: {
      User: testUserPattern,
    },
  });
  await client.libraryItem.deleteMany({
    where: {
      User: testUserPattern,
    },
  });
  await client.game.deleteMany({
    where: {
      title: {
        contains: "Test Game",
      },
      libraryItems: {
        none: {},
      },
    },
  });
  await deleteTestUsersByPattern("test-");
  await deleteTestUsersByPattern("e2e-");
}
export async function seedDefaultTestUser(): Promise<TestUser> {
  const defaultUser = {
    email: "test-user@example.com",
    username: "testuser",
    password: "TestPassword123!",
  };
  try {
    await deleteTestUser(defaultUser.email);
  } catch {}
  return createTestUser(defaultUser);
}
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
export interface TestGame {
  id: string;
  igdbId: number;
  title: string;
  coverImage?: string | null;
}
export async function createTestGame(data?: {
  igdbId?: number;
  title?: string;
  slug?: string;
  coverImage?: string | null;
}): Promise<TestGame> {
  const igdbId = data?.igdbId ?? Math.floor(Math.random() * 1000000);
  const title = data?.title ?? `Test Game ${igdbId}`;
  const slug = data?.slug ?? `test-game-${igdbId}`;
  const game = await getPrisma().game.create({
    data: {
      igdbId,
      title,
      slug,
      coverImage: data?.coverImage ?? null,
    },
  });
  return {
    id: game.id,
    igdbId: game.igdbId,
    title: game.title,
    coverImage: game.coverImage,
  };
}
export interface TestLibraryItem {
  id: number;
  userId: string;
  gameId: string;
  status: string;
}
export async function createTestLibraryItem(data: {
  userId: string;
  gameId: string;
  status?: "WANT_TO_PLAY" | "OWNED" | "PLAYING" | "PLAYED";
}): Promise<TestLibraryItem> {
  const libraryItem = await getPrisma().libraryItem.create({
    data: {
      userId: data.userId,
      gameId: data.gameId,
      status: data.status ?? "WANT_TO_PLAY",
    },
  });
  return {
    id: libraryItem.id,
    userId: libraryItem.userId,
    gameId: libraryItem.gameId,
    status: libraryItem.status,
  };
}
export interface TestJournalEntry {
  id: string;
  userId: string;
  gameId: string;
  title: string | null;
  content: string;
}
export async function createTestJournalEntry(data: {
  userId: string;
  gameId: string;
  libraryItemId?: number;
  title?: string;
  content: string;
  playSession?: number;
}): Promise<TestJournalEntry> {
  const entry = await getPrisma().journalEntry.create({
    data: {
      userId: data.userId,
      gameId: data.gameId,
      libraryItemId: data.libraryItemId ?? null,
      title: data.title ?? null,
      content: data.content,
      playSession: data.playSession ?? null,
    },
  });
  return {
    id: entry.id,
    userId: entry.userId,
    gameId: entry.gameId,
    title: entry.title,
    content: entry.content,
  };
}
export async function deleteTestJournalEntries(userId: string): Promise<void> {
  await getPrisma().journalEntry.deleteMany({
    where: { userId },
  });
}
export async function cleanupUserTestData(userId: string): Promise<void> {
  const client = getPrisma();
  await client.journalEntry.deleteMany({ where: { userId } });
  await client.libraryItem.deleteMany({ where: { userId } });
  await client.game.deleteMany({
    where: {
      title: { contains: "Test Game" },
      libraryItems: { none: {} },
    },
  });
}
