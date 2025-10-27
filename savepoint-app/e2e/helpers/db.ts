import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      usernameNormalized: data.username.toLowerCase(), // Important: set normalized username for uniqueness check
      password: hashedPassword,
    },
  });

  return {
    id: user.id,
    email: user.email ?? data.email, // Fallback to input if null
    username: user.username ?? data.username, // Fallback to input if null
    password: data.password, // Return original password for test usage
  };
}

export async function deleteTestUser(email: string): Promise<void> {
  await prisma.user.delete({
    where: { email },
  });
}
export async function deleteTestUsersByPattern(
  emailPattern: string
): Promise<void> {
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: emailPattern,
      },
    },
  });
}

export async function clearTestData(): Promise<void> {
  // Define test user pattern for cleanup
  const testUserPattern = {
    OR: [{ email: { contains: "test-" } }, { email: { contains: "e2e-" } }],
  };

  // 1. Delete JournalEntry records for test users
  await prisma.journalEntry.deleteMany({
    where: {
      user: testUserPattern,
    },
  });

  // 2. Delete Review records for test users
  await prisma.review.deleteMany({
    where: {
      User: testUserPattern,
    },
  });

  // 3. Delete ImportedGame records for test users
  await prisma.importedGame.deleteMany({
    where: {
      User: testUserPattern,
    },
  });

  // 4. Delete IgnoredImportedGames records for test users
  await prisma.ignoredImportedGames.deleteMany({
    where: {
      User: testUserPattern,
    },
  });

  // 5. Delete LibraryItem records for test users
  await prisma.libraryItem.deleteMany({
    where: {
      User: testUserPattern,
    },
  });

  // 6. Delete test games (no time filter - delete all test games)
  // Only delete games that have no remaining library items
  await prisma.game.deleteMany({
    where: {
      title: {
        contains: "Test Game",
      },
      libraryItems: {
        none: {},
      },
    },
  });

  // 7. Delete test users (Account and Session will cascade)
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
  await prisma.$disconnect();
}

export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
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
  coverImage?: string | null;
}): Promise<TestGame> {
  const igdbId = data?.igdbId ?? Math.floor(Math.random() * 1000000);
  const title = data?.title ?? `Test Game ${igdbId}`;

  const game = await prisma.game.create({
    data: {
      igdbId,
      title,
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
  status?:
    | "CURIOUS_ABOUT"
    | "CURRENTLY_EXPLORING"
    | "TOOK_A_BREAK"
    | "EXPERIENCED"
    | "WISHLIST"
    | "REVISITING";
}): Promise<TestLibraryItem> {
  const libraryItem = await prisma.libraryItem.create({
    data: {
      userId: data.userId,
      gameId: data.gameId,
      status: data.status ?? "CURIOUS_ABOUT",
    },
  });

  return {
    id: libraryItem.id,
    userId: libraryItem.userId,
    gameId: libraryItem.gameId,
    status: libraryItem.status,
  };
}
