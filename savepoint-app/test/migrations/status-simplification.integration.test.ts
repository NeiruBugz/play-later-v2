import type { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { execSync } from "child_process";
import { nanoid } from "nanoid";
import { Pool } from "pg";

let testDatabase: PrismaClient;
let pool: Pool;

describe("Status Simplification Migration", () => {
  let testUserId: string;
  let testGameId: string;

  beforeAll(async () => {
    const testDatabaseName = `test_${nanoid()}`;
    const databaseUrl = `postgresql://postgres:postgres@localhost:6432/${testDatabaseName}`;

    try {
      execSync(
        `docker exec savepoint-postgres createdb -U postgres ${testDatabaseName}`,
        { stdio: "ignore" }
      );

      pool = new Pool({ connectionString: databaseUrl });
      const adapter = new PrismaPg(pool);
      const { PrismaClient: TestPrismaClient } = await import(
        "@prisma/client"
      );
      testDatabase = new TestPrismaClient({ adapter }) as PrismaClient;
      await testDatabase.$connect();

      await testDatabase.$executeRawUnsafe(`
        CREATE TABLE "User" (
          id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT UNIQUE,
          "emailVerified" TIMESTAMP(3),
          image TEXT,
          password TEXT,
          username TEXT UNIQUE,
          "usernameNormalized" TEXT UNIQUE,
          "profileSetupCompletedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          "steamProfileURL" TEXT,
          "steamId64" TEXT,
          "steamUsername" TEXT,
          "steamAvatar" TEXT,
          "steamConnectedAt" TIMESTAMP(3)
        );
      `);

      await testDatabase.$executeRawUnsafe(`
        CREATE TABLE "Game" (
          id TEXT PRIMARY KEY,
          "igdbId" INTEGER UNIQUE NOT NULL,
          title TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          description TEXT,
          "coverImage" TEXT,
          "steamAppId" INTEGER,
          "releaseDate" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        );
      `);

      await testDatabase.$executeRawUnsafe(`
        CREATE TYPE "LibraryItemStatus" AS ENUM (
          'WISHLIST', 'CURIOUS_ABOUT', 'CURRENTLY_EXPLORING',
          'REVISITING', 'TOOK_A_BREAK', 'EXPERIENCED',
          'WANT_TO_PLAY', 'OWNED', 'PLAYING', 'PLAYED'
        );
      `);

      await testDatabase.$executeRawUnsafe(`
        CREATE TYPE "AcquisitionType" AS ENUM ('PHYSICAL', 'DIGITAL', 'SUBSCRIPTION');
      `);

      await testDatabase.$executeRawUnsafe(`
        CREATE TABLE "LibraryItem" (
          id SERIAL PRIMARY KEY,
          status "LibraryItemStatus" NOT NULL DEFAULT 'EXPERIENCED',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          platform TEXT,
          "userId" TEXT NOT NULL REFERENCES "User"(id),
          "acquisitionType" "AcquisitionType" NOT NULL DEFAULT 'DIGITAL',
          "gameId" TEXT NOT NULL REFERENCES "Game"(id) ON DELETE CASCADE,
          "startedAt" TIMESTAMP(3),
          "completedAt" TIMESTAMP(3)
        );
      `);

      testUserId = nanoid();
      testGameId = nanoid();

      await testDatabase.$executeRawUnsafe(
        `INSERT INTO "User" (id, email, username, "usernameNormalized", "updatedAt") VALUES ($1, $2, $3, $4, NOW())`,
        testUserId,
        `test-${testUserId}@example.com`,
        `testuser-${testUserId}`,
        `testuser-${testUserId}`.toLowerCase()
      );

      await testDatabase.$executeRawUnsafe(
        `INSERT INTO "Game" (id, "igdbId", title, slug, "updatedAt") VALUES ($1, $2, $3, $4, NOW())`,
        testGameId,
        Math.floor(Math.random() * 1000000),
        `Test Game ${testGameId}`,
        `test-game-${testGameId}`
      );
    } catch (error) {
      console.error("Error setting up test database", error);
      throw error;
    }
  });

  afterAll(async () => {
    const dbName = pool?.options?.connectionString?.split("/").pop();

    if (testDatabase) {
      await testDatabase.$disconnect();
    }
    if (pool) {
      await pool.end();
    }

    if (dbName) {
      try {
        execSync(
          `docker exec savepoint-postgres dropdb --if-exists -U postgres ${dbName}`,
          { stdio: "ignore" }
        );
      } catch (error) {
        console.warn("Failed to cleanup test database:", error);
      }
    }
  });

  beforeEach(async () => {
    await testDatabase.$executeRawUnsafe(`TRUNCATE TABLE "LibraryItem" CASCADE;`);
  });

  const insertLibraryItemWithRawStatus = async (
    userId: string,
    gameId: string,
    status: string
  ) => {
    await testDatabase.$executeRawUnsafe(
      `INSERT INTO "LibraryItem" ("userId", "gameId", "status") VALUES ($1, $2, $3)`,
      userId,
      gameId,
      status
    );
  };

  const countByStatus = async (status: string): Promise<number> => {
    const result = await testDatabase.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM "LibraryItem" WHERE status = $1`,
      status
    );
    return Number(result[0].count);
  };

  const runDataMigrationSql = async () => {
    await testDatabase.$executeRawUnsafe(`
      UPDATE "LibraryItem" SET status = 'WANT_TO_PLAY' WHERE status IN ('WISHLIST', 'CURIOUS_ABOUT');
    `);
    await testDatabase.$executeRawUnsafe(`
      UPDATE "LibraryItem" SET status = 'PLAYING' WHERE status IN ('CURRENTLY_EXPLORING', 'REVISITING');
    `);
    await testDatabase.$executeRawUnsafe(`
      UPDATE "LibraryItem" SET status = 'PLAYED' WHERE status IN ('TOOK_A_BREAK', 'EXPERIENCED');
    `);
  };

  describe("given database has entries with all 6 old statuses", () => {
    beforeEach(async () => {
      await insertLibraryItemWithRawStatus(testUserId, testGameId, "WISHLIST");
      await insertLibraryItemWithRawStatus(
        testUserId,
        testGameId,
        "CURIOUS_ABOUT"
      );
      await insertLibraryItemWithRawStatus(
        testUserId,
        testGameId,
        "CURRENTLY_EXPLORING"
      );
      await insertLibraryItemWithRawStatus(
        testUserId,
        testGameId,
        "REVISITING"
      );
      await insertLibraryItemWithRawStatus(
        testUserId,
        testGameId,
        "TOOK_A_BREAK"
      );
      await insertLibraryItemWithRawStatus(
        testUserId,
        testGameId,
        "EXPERIENCED"
      );
    });

    describe("when migration is executed", () => {
      it("should consolidate WISHLIST and CURIOUS_ABOUT into WANT_TO_PLAY", async () => {
        await runDataMigrationSql();
        const wantToPlay = await countByStatus("WANT_TO_PLAY");
        expect(wantToPlay).toBe(2);
      });

      it("should consolidate CURRENTLY_EXPLORING and REVISITING into PLAYING", async () => {
        await runDataMigrationSql();
        const playing = await countByStatus("PLAYING");
        expect(playing).toBe(2);
      });

      it("should consolidate TOOK_A_BREAK and EXPERIENCED into PLAYED", async () => {
        await runDataMigrationSql();
        const played = await countByStatus("PLAYED");
        expect(played).toBe(2);
      });

      it("should leave no entries with old status values", async () => {
        await runDataMigrationSql();
        const oldStatuses = [
          "WISHLIST",
          "CURIOUS_ABOUT",
          "CURRENTLY_EXPLORING",
          "REVISITING",
          "TOOK_A_BREAK",
          "EXPERIENCED",
        ];
        for (const status of oldStatuses) {
          const count = await countByStatus(status);
          expect(count).toBe(0);
        }
      });

      it("should preserve total number of library items", async () => {
        const countBefore = await testDatabase.libraryItem.count();
        expect(countBefore).toBe(6);

        await runDataMigrationSql();

        const countAfter = await testDatabase.libraryItem.count();
        expect(countAfter).toBe(6);
      });
    });
  });

  describe("given database has no entries with old statuses", () => {
    beforeEach(async () => {
      await insertLibraryItemWithRawStatus(testUserId, testGameId, "PLAYED");
    });

    it("should not modify existing entries with new statuses", async () => {
      const countBefore = await countByStatus("PLAYED");
      expect(countBefore).toBe(1);

      await runDataMigrationSql();

      const countAfter = await countByStatus("PLAYED");
      expect(countAfter).toBe(1);
    });
  });

  describe("given database has mix of old and new statuses", () => {
    beforeEach(async () => {
      await insertLibraryItemWithRawStatus(testUserId, testGameId, "WISHLIST");
      await insertLibraryItemWithRawStatus(
        testUserId,
        testGameId,
        "CURRENTLY_EXPLORING"
      );
      await insertLibraryItemWithRawStatus(
        testUserId,
        testGameId,
        "WANT_TO_PLAY"
      );
      await insertLibraryItemWithRawStatus(testUserId, testGameId, "PLAYED");
    });

    it("should only migrate old status values and preserve new ones", async () => {
      const countBefore = await testDatabase.libraryItem.count();
      expect(countBefore).toBe(4);

      await runDataMigrationSql();

      const countAfter = await testDatabase.libraryItem.count();
      expect(countAfter).toBe(4);

      const wantToPlay = await countByStatus("WANT_TO_PLAY");
      expect(wantToPlay).toBe(2);

      const playing = await countByStatus("PLAYING");
      expect(playing).toBe(1);

      const played = await countByStatus("PLAYED");
      expect(played).toBe(1);
    });
  });
});
