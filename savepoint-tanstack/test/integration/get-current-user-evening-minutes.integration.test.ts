import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getCurrentUserWorker } from "@/entities/session/api/get-current-user.worker";

import { createUser } from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-current-user-evening-minutes");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.user.deleteMany();
});

describe(getCurrentUserWorker, () => {
  describe("given a signed-in user who never chose an evening length", () => {
    it("returns 105 minutes", async () => {
      const user = await createUser(db.prisma);

      const result = await getCurrentUserWorker({
        id: user.id,
        name: user.name,
        image: null,
      });

      expect(result.eveningMinutes).toBe(105);
    });
  });

  describe("given a signed-in user who chose 180 minutes", () => {
    it("returns 180 minutes", async () => {
      const user = await createUser(db.prisma, { eveningMinutes: 180 });

      const result = await getCurrentUserWorker({
        id: user.id,
        name: user.name,
        image: null,
      });

      expect(result.eveningMinutes).toBe(180);
    });
  });

  describe("given a signed-out visitor", () => {
    it("returns no user and the default 105 minutes", async () => {
      const result = await getCurrentUserWorker(null);

      expect(result).toMatchObject({ user: null, eveningMinutes: 105 });
    });
  });
});
