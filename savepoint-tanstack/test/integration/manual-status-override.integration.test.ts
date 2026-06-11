/**
 * Integration tests for setLibraryStatusManual / clearLibraryStatusManual
 * entity fns (Slice 6 / spec 016 §2.9 — manual override that sticks).
 *
 * Imports entity functions directly — not createServerFn wrappers.
 * See FOOT-GUNS.md foot-gun #8.
 *
 * Covers:
 * - setLibraryStatusManual: pins status + sets statusIsManual=true;
 *   a subsequent run mutation does NOT overwrite the pinned status (sticks);
 *   hasBeenPlayed still updates (fact about runs).
 * - clearLibraryStatusManual: clears the flag + recomputes status from runs.
 * - Ownership: both fns throw NotFoundError for a missing-or-other-user item.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { clearLibraryStatusManual } from "@/entities/playthrough/api/clear-library-status-manual.server";
import { createPlaythrough } from "@/entities/playthrough/api/create-playthrough.server";
import { setLibraryStatusManual } from "@/entities/playthrough/api/set-library-status-manual.server";
import { updatePlaythrough } from "@/entities/playthrough/api/update-playthrough.server";
import { NotFoundError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("manual-status-override");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const USER_ID = "manual-override-user-001";
const OTHER_USER_ID = "manual-override-other-002";

async function seedBaseData() {
  await db.prisma.playthrough.deleteMany();
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();

  await db.prisma.user.createMany({
    data: [
      {
        id: USER_ID,
        email: "manual-override@example.com",
        name: "Manual Override User",
        emailVerified: true,
        username: "manualoverrideuser",
        usernameNormalized: "manualoverrideuser",
        isPublicProfile: false,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        id: OTHER_USER_ID,
        email: "manual-override-other@example.com",
        name: "Other User",
        emailVerified: true,
        username: "manualoverrideother",
        usernameNormalized: "manualoverrideother",
        isPublicProfile: false,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ],
  });

  await db.prisma.game.create({
    data: {
      id: "game-manual-override-001",
      igdbId: 77001,
      title: "Override Game",
      slug: "override-game",
      coverImage: null,
      releaseDate: null,
    },
  });
}

// ---------------------------------------------------------------------------
// setLibraryStatusManual
// ---------------------------------------------------------------------------

describe("setLibraryStatusManual", () => {
  describe("given a PLAYING-run item (derived status PLAYING) set manually to PLAYED", () => {
    let libraryItemId: number;
    let runId: string;

    beforeEach(async () => {
      await seedBaseData();

      // Item has a PLAYING run → derived status should be PLAYING
      const item = await db.prisma.libraryItem.create({
        data: {
          userId: USER_ID,
          gameId: "game-manual-override-001",
          status: "PLAYING",
          statusIsManual: false,
          hasBeenPlayed: false,
          acquisitionType: "DIGITAL",
        },
      });
      libraryItemId = item.id;

      const run = await db.prisma.playthrough.create({
        data: {
          libraryItemId,
          ordinal: 1,
          kind: "FIRST",
          status: "PLAYING",
          playtimeMinutes: 30,
        },
      });
      runId = run.id;

      await setLibraryStatusManual(USER_ID, libraryItemId, "PLAYED");
    });

    it("sets the library item status to the pinned value", async () => {
      const item = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { id: libraryItemId },
      });
      expect(item.status).toBe("PLAYED");
    });

    it("sets statusIsManual to true", async () => {
      const item = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { id: libraryItemId },
      });
      expect(item.statusIsManual).toBe(true);
    });

    describe("when a subsequent run mutation fires (update run to FINISHED)", () => {
      beforeEach(async () => {
        // This proves the manual override sticks even after a run mutation
        // (syncLibraryStatusFromRuns respects statusIsManual).
        await updatePlaythrough(USER_ID, { id: runId, status: "FINISHED" });
      });

      it("keeps the manually-pinned status (does not recompute to derived)", async () => {
        const item = await db.prisma.libraryItem.findUniqueOrThrow({
          where: { id: libraryItemId },
        });
        // Manual status = PLAYED; derived would also be PLAYED here, but
        // the important thing is statusIsManual stays true and no recompute happens.
        expect(item.status).toBe("PLAYED");
        expect(item.statusIsManual).toBe(true);
      });

      it("still refreshes hasBeenPlayed (fact about runs, always updated)", async () => {
        const item = await db.prisma.libraryItem.findUniqueOrThrow({
          where: { id: libraryItemId },
        });
        // FINISHED run → hasBeenPlayed true even under manual override.
        expect(item.hasBeenPlayed).toBe(true);
      });
    });

    describe("when a new PLAYING run is created while the override is active", () => {
      beforeEach(async () => {
        await createPlaythrough(USER_ID, {
          libraryItemId,
          status: "PLAYING",
          playtimeMinutes: 0,
        });
      });

      it("does not overwrite the manually-pinned status with the derived value", async () => {
        const item = await db.prisma.libraryItem.findUniqueOrThrow({
          where: { id: libraryItemId },
        });
        // Derived would be PLAYING (has a PLAYING run), but manual = PLAYED.
        expect(item.status).toBe("PLAYED");
        expect(item.statusIsManual).toBe(true);
      });
    });
  });

  describe("given an item owned by a different user", () => {
    let otherItemId: number;

    beforeEach(async () => {
      await seedBaseData();

      const item = await db.prisma.libraryItem.create({
        data: {
          userId: OTHER_USER_ID,
          gameId: "game-manual-override-001",
          status: "PLAYING",
          statusIsManual: false,
          hasBeenPlayed: false,
          acquisitionType: "DIGITAL",
        },
      });
      otherItemId = item.id;
    });

    it("throws NotFoundError for a missing-or-not-yours item", async () => {
      await expect(
        setLibraryStatusManual(USER_ID, otherItemId, "PLAYED")
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("given a non-existent libraryItemId", () => {
    beforeEach(async () => {
      await seedBaseData();
    });

    it("throws NotFoundError", async () => {
      await expect(
        setLibraryStatusManual(USER_ID, 999999, "PLAYED")
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});

// ---------------------------------------------------------------------------
// clearLibraryStatusManual
// ---------------------------------------------------------------------------

describe("clearLibraryStatusManual", () => {
  describe("given an item with a manually-pinned PLAYED status and a PLAYING run", () => {
    let libraryItemId: number;

    beforeEach(async () => {
      await seedBaseData();

      // Item has been manually pinned to PLAYED despite having a PLAYING run.
      const item = await db.prisma.libraryItem.create({
        data: {
          userId: USER_ID,
          gameId: "game-manual-override-001",
          status: "PLAYED",
          statusIsManual: true,
          hasBeenPlayed: false,
          acquisitionType: "DIGITAL",
        },
      });
      libraryItemId = item.id;

      // The existing run is PLAYING (so derived status should be PLAYING).
      await db.prisma.playthrough.create({
        data: {
          libraryItemId,
          ordinal: 1,
          kind: "FIRST",
          status: "PLAYING",
          playtimeMinutes: 60,
        },
      });

      await clearLibraryStatusManual(USER_ID, libraryItemId);
    });

    it("clears statusIsManual to false", async () => {
      const item = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { id: libraryItemId },
      });
      expect(item.statusIsManual).toBe(false);
    });

    it("recomputes status from the current runs (PLAYING run → PLAYING)", async () => {
      const item = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { id: libraryItemId },
      });
      // Derived: any PLAYING run → status PLAYING.
      expect(item.status).toBe("PLAYING");
    });

    it("recomputes hasBeenPlayed from the current runs (PLAYING only → false)", async () => {
      const item = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { id: libraryItemId },
      });
      expect(item.hasBeenPlayed).toBe(false);
    });
  });

  describe("given an item with a manually-pinned status and only FINISHED runs", () => {
    let libraryItemId: number;

    beforeEach(async () => {
      await seedBaseData();

      const item = await db.prisma.libraryItem.create({
        data: {
          userId: USER_ID,
          gameId: "game-manual-override-001",
          status: "SHELF",
          statusIsManual: true,
          hasBeenPlayed: true,
          acquisitionType: "DIGITAL",
        },
      });
      libraryItemId = item.id;

      // Two FINISHED runs
      await db.prisma.playthrough.createMany({
        data: [
          {
            libraryItemId,
            ordinal: 1,
            kind: "FIRST",
            status: "FINISHED",
            playtimeMinutes: 120,
          },
          {
            libraryItemId,
            ordinal: 2,
            kind: "REPLAY",
            status: "FINISHED",
            playtimeMinutes: 90,
          },
        ],
      });

      await clearLibraryStatusManual(USER_ID, libraryItemId);
    });

    it("recomputes status to PLAYED (any FINISHED run → PLAYED)", async () => {
      const item = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { id: libraryItemId },
      });
      expect(item.status).toBe("PLAYED");
    });

    it("keeps hasBeenPlayed true (FINISHED runs)", async () => {
      const item = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { id: libraryItemId },
      });
      expect(item.hasBeenPlayed).toBe(true);
    });
  });

  describe("given an item owned by a different user", () => {
    let otherItemId: number;

    beforeEach(async () => {
      await seedBaseData();

      const item = await db.prisma.libraryItem.create({
        data: {
          userId: OTHER_USER_ID,
          gameId: "game-manual-override-001",
          status: "PLAYED",
          statusIsManual: true,
          hasBeenPlayed: true,
          acquisitionType: "DIGITAL",
        },
      });
      otherItemId = item.id;
    });

    it("throws NotFoundError for a missing-or-not-yours item", async () => {
      await expect(
        clearLibraryStatusManual(USER_ID, otherItemId)
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("given a non-existent libraryItemId", () => {
    beforeEach(async () => {
      await seedBaseData();
    });

    it("throws NotFoundError", async () => {
      await expect(
        clearLibraryStatusManual(USER_ID, 999999)
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
