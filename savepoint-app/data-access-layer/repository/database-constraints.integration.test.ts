import {
  cleanupDatabase,
  getTestDatabase,
  resetTestDatabase,
  setupDatabase,
} from "@/test/setup/database";
import { createGame, createUser } from "@/test/setup/db-factories";
import {
  AcquisitionType,
  JournalVisibility,
  LibraryItemStatus,
} from "@prisma/client";

vi.mock("@/shared/lib", async () => {
  const actual =
    await vi.importActual<typeof import("@/shared/lib")>("@/shared/lib");
  const { getTestDatabase } = await import("@/test/setup/database");

  return {
    ...actual,
    get prisma() {
      return getTestDatabase();
    },
  };
});

describe("Database Check Constraints - Integration Tests", () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  describe("LibraryItem constraints", () => {
    it("should accept startedAt before createdAt (backdating is allowed)", async () => {
      const prisma = getTestDatabase();
      const user = await createUser();
      const game = await createGame();

      const createdAt = new Date("2024-01-15");
      const startedAt = new Date("2024-01-10");

      const item = await prisma.libraryItem.create({
        data: {
          userId: user.id,
          gameId: game.id,
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
          acquisitionType: AcquisitionType.DIGITAL,
          createdAt,
          startedAt,
        },
      });

      expect(item.startedAt).toEqual(startedAt);
      expect(item.createdAt).toEqual(createdAt);
    });

    it("should accept startedAt after createdAt", async () => {
      const prisma = getTestDatabase();
      const user = await createUser();
      const game = await createGame();

      const createdAt = new Date("2024-01-10");
      const startedAt = new Date("2024-01-15");

      const item = await prisma.libraryItem.create({
        data: {
          userId: user.id,
          gameId: game.id,
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
          acquisitionType: AcquisitionType.DIGITAL,
          createdAt,
          startedAt,
        },
      });

      expect(item.startedAt).toEqual(startedAt);
    });

    it("should accept completedAt before createdAt (backdating is allowed)", async () => {
      const prisma = getTestDatabase();
      const user = await createUser();
      const game = await createGame();

      const createdAt = new Date("2024-01-15");
      const completedAt = new Date("2024-01-10");

      const item = await prisma.libraryItem.create({
        data: {
          userId: user.id,
          gameId: game.id,
          status: LibraryItemStatus.EXPERIENCED,
          acquisitionType: AcquisitionType.DIGITAL,
          createdAt,
          completedAt,
        },
      });

      expect(item.completedAt).toEqual(completedAt);
      expect(item.createdAt).toEqual(createdAt);
    });

    it("should reject completedAt before startedAt", async () => {
      const prisma = getTestDatabase();
      const user = await createUser();
      const game = await createGame();

      const createdAt = new Date("2024-01-10");
      const startedAt = new Date("2024-01-15");
      const completedAt = new Date("2024-01-12");

      await expect(
        prisma.libraryItem.create({
          data: {
            userId: user.id,
            gameId: game.id,
            status: LibraryItemStatus.EXPERIENCED,
            acquisitionType: AcquisitionType.DIGITAL,
            createdAt,
            startedAt,
            completedAt,
          },
        })
      ).rejects.toThrow();
    });

    it("should accept valid date progression (createdAt -> startedAt -> completedAt)", async () => {
      const prisma = getTestDatabase();
      const user = await createUser();
      const game = await createGame();

      const createdAt = new Date("2024-01-10");
      const startedAt = new Date("2024-01-15");
      const completedAt = new Date("2024-01-20");

      const item = await prisma.libraryItem.create({
        data: {
          userId: user.id,
          gameId: game.id,
          status: LibraryItemStatus.EXPERIENCED,
          acquisitionType: AcquisitionType.DIGITAL,
          createdAt,
          startedAt,
          completedAt,
        },
      });

      expect(item.createdAt).toEqual(createdAt);
      expect(item.startedAt).toEqual(startedAt);
      expect(item.completedAt).toEqual(completedAt);
    });

    it("should accept null startedAt and completedAt", async () => {
      const prisma = getTestDatabase();
      const user = await createUser();
      const game = await createGame();

      const item = await prisma.libraryItem.create({
        data: {
          userId: user.id,
          gameId: game.id,
          status: LibraryItemStatus.CURIOUS_ABOUT,
          acquisitionType: AcquisitionType.DIGITAL,
          startedAt: null,
          completedAt: null,
        },
      });

      expect(item.startedAt).toBeNull();
      expect(item.completedAt).toBeNull();
    });
  });

  describe("Review constraints", () => {
    it("should reject rating below 0", async () => {
      const prisma = getTestDatabase();
      const user = await createUser();
      const game = await createGame();

      await expect(
        prisma.review.create({
          data: {
            userId: user.id,
            gameId: game.id,
            rating: -1,
            content: "Great game!",
          },
        })
      ).rejects.toThrow();
    });

    it("should reject rating above 10", async () => {
      const prisma = getTestDatabase();
      const user = await createUser();
      const game = await createGame();

      await expect(
        prisma.review.create({
          data: {
            userId: user.id,
            gameId: game.id,
            rating: 11,
            content: "Amazing game!",
          },
        })
      ).rejects.toThrow();
    });

    it("should accept rating of 0", async () => {
      const prisma = getTestDatabase();
      const user = await createUser();
      const game = await createGame();

      const review = await prisma.review.create({
        data: {
          userId: user.id,
          gameId: game.id,
          rating: 0,
          content: "Terrible game",
        },
      });

      expect(review.rating).toBe(0);
    });

    it("should accept rating of 10", async () => {
      const prisma = getTestDatabase();
      const user = await createUser();
      const game = await createGame();

      const review = await prisma.review.create({
        data: {
          userId: user.id,
          gameId: game.id,
          rating: 10,
          content: "Masterpiece!",
        },
      });

      expect(review.rating).toBe(10);
    });

    it("should accept rating between 0 and 10", async () => {
      const prisma = getTestDatabase();
      const user = await createUser();
      const game = await createGame();

      const review = await prisma.review.create({
        data: {
          userId: user.id,
          gameId: game.id,
          rating: 7,
          content: "Good game",
        },
      });

      expect(review.rating).toBe(7);
    });
  });

  describe("JournalEntry constraints", () => {
    it("should reject playSession of 0", async () => {
      const prisma = getTestDatabase();
      const user = await createUser();
      const game = await createGame();

      await expect(
        prisma.journalEntry.create({
          data: {
            userId: user.id,
            gameId: game.id,
            content: "First session",
            playSession: 0,
            visibility: JournalVisibility.PRIVATE,
          },
        })
      ).rejects.toThrow();
    });

    it("should reject negative playSession", async () => {
      const prisma = getTestDatabase();
      const user = await createUser();
      const game = await createGame();

      await expect(
        prisma.journalEntry.create({
          data: {
            userId: user.id,
            gameId: game.id,
            content: "First session",
            playSession: -5,
            visibility: JournalVisibility.PRIVATE,
          },
        })
      ).rejects.toThrow();
    });

    it("should accept positive playSession", async () => {
      const prisma = getTestDatabase();
      const user = await createUser();
      const game = await createGame();

      const entry = await prisma.journalEntry.create({
        data: {
          userId: user.id,
          gameId: game.id,
          content: "First session",
          playSession: 1,
          visibility: JournalVisibility.PRIVATE,
        },
      });

      expect(entry.playSession).toBe(1);
    });

    it("should accept null playSession", async () => {
      const prisma = getTestDatabase();
      const user = await createUser();
      const game = await createGame();

      const entry = await prisma.journalEntry.create({
        data: {
          userId: user.id,
          gameId: game.id,
          content: "General thoughts",
          playSession: null,
          visibility: JournalVisibility.PRIVATE,
        },
      });

      expect(entry.playSession).toBeNull();
    });

    it("should reject publishedAt before createdAt", async () => {
      const prisma = getTestDatabase();
      const user = await createUser();
      const game = await createGame();

      const createdAt = new Date("2024-01-15");
      const publishedAt = new Date("2024-01-10");

      await expect(
        prisma.journalEntry.create({
          data: {
            userId: user.id,
            gameId: game.id,
            content: "Public entry",
            visibility: JournalVisibility.PUBLIC,
            createdAt,
            publishedAt,
          },
        })
      ).rejects.toThrow();
    });

    it("should accept publishedAt after createdAt", async () => {
      const prisma = getTestDatabase();
      const user = await createUser();
      const game = await createGame();

      const createdAt = new Date("2024-01-10");
      const publishedAt = new Date("2024-01-15");

      const entry = await prisma.journalEntry.create({
        data: {
          userId: user.id,
          gameId: game.id,
          content: "Public entry",
          visibility: JournalVisibility.PUBLIC,
          createdAt,
          publishedAt,
        },
      });

      expect(entry.publishedAt).toEqual(publishedAt);
    });

    it("should accept null publishedAt", async () => {
      const prisma = getTestDatabase();
      const user = await createUser();
      const game = await createGame();

      const entry = await prisma.journalEntry.create({
        data: {
          userId: user.id,
          gameId: game.id,
          content: "Private draft",
          visibility: JournalVisibility.PRIVATE,
          publishedAt: null,
        },
      });

      expect(entry.publishedAt).toBeNull();
    });
  });
});
