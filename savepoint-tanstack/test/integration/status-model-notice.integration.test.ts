import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { acknowledgeStatusModelNotice } from "@/entities/profile/api/acknowledge-status-model-notice.server";
import { acknowledgeNoticeWorker } from "@/features/whats-new/api/acknowledge-notice-fn.worker";
import { NotFoundError, UnauthorizedError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("status-model-notice");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

function makeUser(id: string, statusModelNoticePending?: boolean) {
  return {
    id,
    email: `${id}@example.com`,
    name: id,
    emailVerified: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    ...(statusModelNoticePending === undefined
      ? {}
      : { statusModelNoticePending }),
  };
}

async function readFlag(id: string) {
  const row = await db.prisma.user.findUniqueOrThrow({
    where: { id },
    select: { statusModelNoticePending: true },
  });
  return row.statusModelNoticePending;
}

beforeEach(async () => {
  await db.prisma.user.deleteMany();
  await db.prisma.user.create({ data: makeUser("smn-existing", true) });
  await db.prisma.user.create({ data: makeUser("smn-other", true) });
  await db.prisma.user.create({ data: makeUser("smn-new") });
});

describe("status model notice", () => {
  it("a newly created user never has the notice pending", async () => {
    expect(await readFlag("smn-new")).toBe(false);
  });

  it("acknowledging clears the flag for that user only", async () => {
    await acknowledgeStatusModelNotice("smn-existing");

    expect(await readFlag("smn-existing")).toBe(false);
    expect(await readFlag("smn-other")).toBe(true);
  });

  it("acknowledging twice keeps the flag false", async () => {
    await acknowledgeStatusModelNotice("smn-existing");
    await acknowledgeStatusModelNotice("smn-existing");

    expect(await readFlag("smn-existing")).toBe(false);
  });

  it("acknowledging an unknown user throws NotFoundError", async () => {
    await expect(acknowledgeStatusModelNotice("missing")).rejects.toThrow(
      NotFoundError
    );
  });

  it("the worker clears the flag and returns an empty object", async () => {
    await expect(acknowledgeNoticeWorker("smn-existing")).resolves.toEqual({});
    expect(await readFlag("smn-existing")).toBe(false);
  });

  it("the worker without a user throws UnauthorizedError and changes nothing", async () => {
    await expect(acknowledgeNoticeWorker(undefined)).rejects.toThrow(
      UnauthorizedError
    );
    expect(await readFlag("smn-existing")).toBe(true);
  });
});
