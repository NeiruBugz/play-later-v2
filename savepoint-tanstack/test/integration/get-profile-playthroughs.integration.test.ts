/**
 * RED integration test for getProfilePlaythroughs (Spec 016 Slice 8 — public-profile
 * playthroughs timeline).
 *
 * This test is intentionally failing: `@/entities/playthrough/api/get-profile-playthroughs.server`
 * does not exist yet. The import fails at module-resolution — that is the canonical RED state.
 * Do not implement production code in this file.
 *
 * Real Prisma against the isolated test DB for all assertions.
 *
 * ============================================================
 * CONTRACT (locked here; GREEN agent must not deviate without
 * updating this comment block)
 * ============================================================
 *
 * Function signature:
 *   getProfilePlaythroughs(
 *     username: string,
 *     viewerId?: string,
 *     limit?: number,   // default 12
 *   ): Promise<ProfilePlaythrough[]>
 *
 * Return shape (ProfilePlaythrough):
 *   {
 *     id: string;
 *     kind: "FIRST" | "REPLAY";
 *     status: "PLAYING" | "FINISHED" | "ABANDONED";
 *     platform: string | null;
 *     startedAt: Date | null;
 *     finishedAt: Date | null;
 *     rating: number | null;
 *     notes: string | null;
 *     game: {
 *       title: string;
 *       slug: string;
 *       coverImage: string | null;
 *     };
 *   }
 *
 * Privacy rule:
 *   - public profile + any viewer (anonymous or authenticated) → returns runs newest-first
 *   - private profile + non-owner viewer (or anonymous) → returns []
 *   - private profile + owner viewer → returns runs newest-first
 *   - unknown username → returns []
 *
 * Ordering: newest first (by createdAt DESC — proxy for run start; consistent with
 * how the rest of the timeline renders).
 *
 * Limit: defaults to 12; honours an explicit limit argument.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";

// RED import — this module does not exist until the GREEN step.
import { getProfilePlaythroughs } from "@/entities/playthrough/api/get-profile-playthroughs.server";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// ---------------------------------------------------------------------------
// Isolated DB
// ---------------------------------------------------------------------------

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-profile-playthroughs");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeUser(
  suffix: string,
  opts: { isPublicProfile?: boolean } = {}
): Parameters<typeof db.prisma.user.create>[0]["data"] {
  return {
    id: `gpp-user-${suffix}`,
    email: `gpp-${suffix}@example.com`,
    name: `GPP User ${suffix}`,
    username: `gpp-${suffix}`,
    usernameNormalized: `gpp-${suffix}`,
    emailVerified: true,
    isPublicProfile: opts.isPublicProfile ?? true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

let igdbIdCounter = 900001;
function makeGame(
  suffix: string
): Parameters<typeof db.prisma.game.create>[0]["data"] {
  return {
    id: `gpp-game-${suffix}`,
    igdbId: igdbIdCounter++,
    title: `GPP Game ${suffix}`,
    slug: `gpp-game-${suffix}`,
    coverImage: `/covers/gpp-game-${suffix}.jpg`,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

// ---------------------------------------------------------------------------
// Seed: two users (one PUBLIC, one PRIVATE), each with a game + library item
// + two runs (one PLAYING, one FINISHED with rating + note).
//
// Teardown: deleted in afterAll via db.teardown().
// ---------------------------------------------------------------------------

beforeAll(async () => {
  // --- public user ---
  await db.prisma.user.create({
    data: makeUser("public", { isPublicProfile: true }),
  });
  await db.prisma.game.create({ data: makeGame("pub1") });
  await db.prisma.libraryItem.create({
    data: {
      id: 70001,
      userId: "gpp-user-public",
      gameId: "gpp-game-pub1",
      status: "PLAYED",
    },
  });
  // Older run — PLAYING, no finishedAt
  await db.prisma.playthrough.create({
    data: {
      id: "gpp-run-pub-older",
      libraryItemId: 70001,
      ordinal: 1,
      kind: "FIRST",
      status: "PLAYING",
      platform: "PC",
      startedAt: new Date("2024-03-01T00:00:00.000Z"),
      finishedAt: null,
      rating: null,
      notes: null,
      createdAt: new Date("2024-03-01T00:00:00.000Z"),
      updatedAt: new Date("2024-03-01T00:00:00.000Z"),
    },
  });
  // Newer run — FINISHED with rating + note
  await db.prisma.playthrough.create({
    data: {
      id: "gpp-run-pub-newer",
      libraryItemId: 70001,
      ordinal: 2,
      kind: "REPLAY",
      status: "FINISHED",
      platform: "PS5",
      startedAt: new Date("2024-06-01T00:00:00.000Z"),
      finishedAt: new Date("2024-07-01T00:00:00.000Z"),
      rating: 9,
      notes: "Great replay",
      createdAt: new Date("2024-06-01T00:00:00.000Z"),
      updatedAt: new Date("2024-06-01T00:00:00.000Z"),
    },
  });

  // --- private user ---
  await db.prisma.user.create({
    data: makeUser("private", { isPublicProfile: false }),
  });
  await db.prisma.game.create({ data: makeGame("prv1") });
  await db.prisma.libraryItem.create({
    data: {
      id: 70002,
      userId: "gpp-user-private",
      gameId: "gpp-game-prv1",
      status: "PLAYING",
    },
  });
  // One PLAYING run
  await db.prisma.playthrough.create({
    data: {
      id: "gpp-run-prv-playing",
      libraryItemId: 70002,
      ordinal: 1,
      kind: "FIRST",
      status: "PLAYING",
      platform: "Switch",
      startedAt: new Date("2024-05-01T00:00:00.000Z"),
      finishedAt: null,
      rating: null,
      notes: null,
      createdAt: new Date("2024-05-01T00:00:00.000Z"),
      updatedAt: new Date("2024-05-01T00:00:00.000Z"),
    },
  });
  // One FINISHED run with rating + note
  await db.prisma.playthrough.create({
    data: {
      id: "gpp-run-prv-finished",
      libraryItemId: 70002,
      ordinal: 2,
      kind: "REPLAY",
      status: "FINISHED",
      platform: "PC",
      startedAt: new Date("2024-08-01T00:00:00.000Z"),
      finishedAt: new Date("2024-09-01T00:00:00.000Z"),
      rating: 8,
      notes: "Owner only",
      createdAt: new Date("2024-08-01T00:00:00.000Z"),
      updatedAt: new Date("2024-08-01T00:00:00.000Z"),
    },
  });
}, 60_000);

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("getProfilePlaythroughs", () => {
  // -------------------------------------------------------------------------
  // Public profile — anonymous viewer
  // -------------------------------------------------------------------------

  describe("given a public profile and an anonymous viewer", () => {
    it("returns the runs newest-first", async () => {
      const runs = await getProfilePlaythroughs("gpp-public");

      expect(runs.length).toBe(2);
      expect(runs[0]!.id).toBe("gpp-run-pub-newer");
      expect(runs[1]!.id).toBe("gpp-run-pub-older");
    });

    it("includes game title, slug, and coverImage on each run", async () => {
      const runs = await getProfilePlaythroughs("gpp-public");

      for (const run of runs) {
        expect(run.game.title).toBe("GPP Game pub1");
        expect(run.game.slug).toBe("gpp-game-pub1");
        expect(run.game.coverImage).toBe("/covers/gpp-game-pub1.jpg");
      }
    });

    it("includes kind, status, platform, startedAt, finishedAt, rating, notes", async () => {
      const runs = await getProfilePlaythroughs("gpp-public");
      const newer = runs[0]!;

      expect(newer.kind).toBe("REPLAY");
      expect(newer.status).toBe("FINISHED");
      expect(newer.platform).toBe("PS5");
      expect(newer.startedAt).toEqual(new Date("2024-06-01T00:00:00.000Z"));
      expect(newer.finishedAt).toEqual(new Date("2024-07-01T00:00:00.000Z"));
      expect(newer.rating).toBe(9);
      expect(newer.notes).toBe("Great replay");
    });

    it("exposes null finishedAt on a PLAYING run", async () => {
      const runs = await getProfilePlaythroughs("gpp-public");
      const older = runs[1]!;

      expect(older.status).toBe("PLAYING");
      expect(older.finishedAt).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Private profile — non-owner viewer
  // -------------------------------------------------------------------------

  describe("given a private profile and a non-owner viewer", () => {
    it("returns an empty array", async () => {
      const runs = await getProfilePlaythroughs(
        "gpp-private",
        "gpp-user-public"
      );

      expect(runs).toEqual([]);
    });

    it("returns an empty array for an anonymous viewer too", async () => {
      const runs = await getProfilePlaythroughs("gpp-private");

      expect(runs).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Private profile — owner viewer
  // -------------------------------------------------------------------------

  describe("given a private profile and the owner as viewer", () => {
    it("returns the runs newest-first", async () => {
      const runs = await getProfilePlaythroughs(
        "gpp-private",
        "gpp-user-private"
      );

      expect(runs.length).toBe(2);
      // newer createdAt is 2024-08-01
      expect(runs[0]!.id).toBe("gpp-run-prv-finished");
      expect(runs[1]!.id).toBe("gpp-run-prv-playing");
    });

    it("includes game data on each run", async () => {
      const runs = await getProfilePlaythroughs(
        "gpp-private",
        "gpp-user-private"
      );

      for (const run of runs) {
        expect(run.game.title).toBe("GPP Game prv1");
        expect(run.game.slug).toBe("gpp-game-prv1");
      }
    });
  });

  // -------------------------------------------------------------------------
  // Unknown username → empty array (no throw)
  // -------------------------------------------------------------------------

  describe("given an unknown username", () => {
    it("returns an empty array", async () => {
      const runs = await getProfilePlaythroughs("gpp-does-not-exist");

      expect(runs).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Limit
  // -------------------------------------------------------------------------

  describe("given a limit smaller than the total run count", () => {
    it("returns at most limit runs", async () => {
      const runs = await getProfilePlaythroughs("gpp-public", undefined, 1);

      expect(runs.length).toBe(1);
      // newest-first, so the FINISHED run comes first
      expect(runs[0]!.id).toBe("gpp-run-pub-newer");
    });
  });
});
