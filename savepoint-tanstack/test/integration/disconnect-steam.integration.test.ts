/**
 * RED integration test for disconnectSteamWorker (Slice 21 Phase B).
 *
 * Worker signature (locked):
 *   disconnectSteamWorker(
 *     userId: string | undefined,
 *   ): Promise<void>
 *
 * Behaviour contract:
 *   - userId === undefined         → throws UnauthorizedError, no DB write.
 *   - user has steamId64 set       → clears it to null.
 *   - user has steamId64 = null    → no-op (idempotent).
 *
 * No input shape — pure clear operation.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// RED import — module does not exist until the GREEN step.
import { disconnectSteamWorker } from "@/features/steam-connect/api/disconnect-steam.worker";
import { UnauthorizedError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// ---------------------------------------------------------------------------
// Isolated DB
// ---------------------------------------------------------------------------

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("disconnect-steam");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

// ---------------------------------------------------------------------------
// Fixtures: connected + disconnected user.
// ---------------------------------------------------------------------------

const CONNECTED_USER_ID = "ds-user-connected";
const DISCONNECTED_USER_ID = "ds-user-disconnected";
const STEAM_ID_64 = "76561198012345678";

beforeEach(async () => {
  await db.prisma.user.deleteMany();
  await db.prisma.user.create({
    data: {
      id: CONNECTED_USER_ID,
      email: "ds-connected@example.com",
      name: "DS Connected",
      emailVerified: true,
      steamId64: STEAM_ID_64,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    },
  });
  await db.prisma.user.create({
    data: {
      id: DISCONNECTED_USER_ID,
      email: "ds-disconnected@example.com",
      name: "DS Disconnected",
      emailVerified: true,
      steamId64: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    },
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("disconnectSteamWorker", () => {
  describe("auth gate", () => {
    it("throws UnauthorizedError when userId is undefined", async () => {
      await expect(disconnectSteamWorker(undefined)).rejects.toThrow(
        UnauthorizedError
      );
    });

    it("does not clear any steamId64 when unauthenticated", async () => {
      await expect(disconnectSteamWorker(undefined)).rejects.toThrow(
        UnauthorizedError
      );

      const user = await db.prisma.user.findUnique({
        where: { id: CONNECTED_USER_ID },
        select: { steamId64: true },
      });
      expect(user?.steamId64).toBe(STEAM_ID_64);
    });
  });

  describe("connected user", () => {
    it("clears steamId64 to null", async () => {
      await disconnectSteamWorker(CONNECTED_USER_ID);

      const user = await db.prisma.user.findUnique({
        where: { id: CONNECTED_USER_ID },
        select: { steamId64: true },
      });
      expect(user?.steamId64).toBeNull();
    });

    it("returns void on success", async () => {
      const result = await disconnectSteamWorker(CONNECTED_USER_ID);
      expect(result).toBeUndefined();
    });
  });

  describe("idempotency", () => {
    it("does not throw when called on an already-disconnected user", async () => {
      await expect(
        disconnectSteamWorker(DISCONNECTED_USER_ID)
      ).resolves.toBeUndefined();
    });

    it("leaves steamId64 null after two consecutive disconnects", async () => {
      await disconnectSteamWorker(CONNECTED_USER_ID);
      await disconnectSteamWorker(CONNECTED_USER_ID);

      const user = await db.prisma.user.findUnique({
        where: { id: CONNECTED_USER_ID },
        select: { steamId64: true },
      });
      expect(user?.steamId64).toBeNull();
    });
  });
});
