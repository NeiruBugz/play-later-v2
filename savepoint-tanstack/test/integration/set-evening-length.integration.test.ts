import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { setEveningLengthWorker } from "@/features/set-evening-length/api/set-evening-length.worker";
import { UnauthorizedError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// Workers are called directly with an explicit userId (CLAUDE.md foot-gun #8).
// `getCurrentUserFn` is a createServerFn wrapper that needs the Start runtime,
// so "the current user reads the new value" is asserted on the persisted
// `user.eveningMinutes` column it selects.

let db: IsolatedDatabase;

const userId = "set-evening-length-user-001";
const DEFAULT_EVENING_MINUTES = 105;
const CHOICES = [60, 90, 105, 120, 150, 180];

beforeAll(async () => {
  db = await setupIsolatedDatabase("set-evening-length");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.user.deleteMany();
  await db.prisma.user.create({
    data: {
      id: userId,
      email: "set-evening-length@example.com",
      name: "Evening User",
      emailVerified: true,
      username: "eveninguser",
      usernameNormalized: "eveninguser",
      image: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    },
  });
});

const readEveningMinutes = async () =>
  (
    await db.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { eveningMinutes: true },
    })
  ).eveningMinutes;

describe("setEveningLengthWorker", () => {
  describe("given a new user who never changed the setting", () => {
    it("has the default 105-minute evening", async () => {
      expect(await readEveningMinutes()).toBe(DEFAULT_EVENING_MINUTES);
    });
  });

  describe.each(CHOICES)(
    "given a signed-in user choosing %i minutes",
    (minutes) => {
      beforeEach(async () => {
        await setEveningLengthWorker(userId, { eveningMinutes: minutes });
      });

      it("saves that evening length", async () => {
        expect(await readEveningMinutes()).toBe(minutes);
      });
    }
  );

  describe.each([30, 45, 100, 135, 200, 360])(
    "given a signed-in user typing their own %i-minute evening",
    (minutes) => {
      beforeEach(async () => {
        await setEveningLengthWorker(userId, { eveningMinutes: minutes });
      });

      it("saves that evening length", async () => {
        expect(await readEveningMinutes()).toBe(minutes);
      });
    }
  );

  describe("given a signed-in user choosing an unusable length", () => {
    it.each([
      ["29 minutes", 29],
      ["361 minutes", 361],
      ["a fractional 100.5 minutes", 100.5],
      ["NaN", Number.NaN],
      ["a string", "180"],
      ["null", null],
    ])("rejects %s and keeps the saved value", async (_label, value) => {
      await expect(
        setEveningLengthWorker(userId, { eveningMinutes: value })
      ).rejects.toThrow();
      expect(await readEveningMinutes()).toBe(DEFAULT_EVENING_MINUTES);
    });
  });

  describe("given a visitor who is not signed in", () => {
    it("requires sign-in", async () => {
      await expect(
        setEveningLengthWorker(undefined, { eveningMinutes: 180 })
      ).rejects.toBeInstanceOf(UnauthorizedError);
      expect(await readEveningMinutes()).toBe(DEFAULT_EVENING_MINUTES);
    });
  });
});
