/**
 * Integration tests for getOnboardingSignals.
 *
 * Covers:
 *   - Returns correct image, steamId64, journalEntryCount for an existing user
 *   - Throws NotFoundError for a non-existent userId
 *   - journalEntryCount increments correctly as entries are added
 *   - image null when user has no avatar
 *   - steamId64 null when Steam not connected
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getOnboardingSignals } from "@/entities/profile/api/get-onboarding-signals.server";
import { NotFoundError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-onboarding-signals");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

function makeUser(
  suffix: string,
  opts: { image?: string | null; steamId64?: string | null } = {}
) {
  return {
    id: `gos-user-${suffix}`,
    email: `gos-${suffix}@example.com`,
    name: `GOS User ${suffix}`,
    username: `gos-${suffix}`,
    emailVerified: true,
    isPublicProfile: true,
    image: opts.image ?? null,
    steamId64: opts.steamId64 ?? null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

describe("getOnboardingSignals", () => {
  describe("given a user with no avatar and no Steam connected", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("base") });
    });

    it("returns image as null", async () => {
      const signals = await getOnboardingSignals("gos-user-base");

      expect(signals.image).toBeNull();
    });

    it("returns steamId64 as null", async () => {
      const signals = await getOnboardingSignals("gos-user-base");

      expect(signals.steamId64).toBeNull();
    });

    it("returns journalEntryCount as 0 when no entries exist", async () => {
      const signals = await getOnboardingSignals("gos-user-base");

      expect(signals.journalEntryCount).toBe(0);
    });
  });

  describe("given a user with an avatar URL", () => {
    beforeEach(async () => {
      await db.prisma.user.create({
        data: makeUser("with-avatar", {
          image: "https://example.com/avatar.png",
        }),
      });
    });

    it("returns the avatar URL in image", async () => {
      const signals = await getOnboardingSignals("gos-user-with-avatar");

      expect(signals.image).toBe("https://example.com/avatar.png");
    });
  });

  describe("given a user with Steam connected", () => {
    beforeEach(async () => {
      await db.prisma.user.create({
        data: makeUser("with-steam", { steamId64: "76561198000000001" }),
      });
    });

    it("returns the steamId64 value", async () => {
      const signals = await getOnboardingSignals("gos-user-with-steam");

      expect(signals.steamId64).toBe("76561198000000001");
    });
  });

  describe("given a user who has authored journal entries", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("journaler") });
      await db.prisma.game.create({
        data: {
          id: "gos-game-j",
          igdbId: 99001,
          title: "Journal Game",
          slug: "journal-game-gos",
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });
      await db.prisma.libraryItem.create({
        data: {
          userId: "gos-user-journaler",
          gameId: "gos-game-j",
          status: "PLAYING",
          acquisitionType: "DIGITAL",
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });
      await db.prisma.journalEntry.createMany({
        data: [
          {
            userId: "gos-user-journaler",
            gameId: "gos-game-j",
            content: "First entry",
            createdAt: new Date("2024-02-01T00:00:00.000Z"),
            updatedAt: new Date("2024-02-01T00:00:00.000Z"),
          },
          {
            userId: "gos-user-journaler",
            gameId: "gos-game-j",
            content: "Second entry",
            createdAt: new Date("2024-02-02T00:00:00.000Z"),
            updatedAt: new Date("2024-02-02T00:00:00.000Z"),
          },
        ],
      });
    });

    it("returns the correct journal entry count", async () => {
      const signals = await getOnboardingSignals("gos-user-journaler");

      expect(signals.journalEntryCount).toBe(2);
    });
  });

  describe("given a user that does not exist", () => {
    it("throws NotFoundError", async () => {
      await expect(
        getOnboardingSignals("gos-user-nonexistent")
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
