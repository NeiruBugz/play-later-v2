/**
 * Unit tests for updateProfile — exercises Prisma error-mapping branches
 * that are structurally untestable via integration tests (TOCTOU race for
 * P2025; array-format meta.target for the legacy Prisma P2002 shape).
 *
 * The Prisma client is mocked globally in test/setup/unit.ts.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/shared/lib/db.server";
import { ConflictError, NotFoundError } from "@/shared/lib/errors";

/**
 * Build a minimal PrismaClientKnownRequestError-like object.
 * The instanceof check in the source uses the Prisma class, but since the
 * mock replaces `prisma.user.update` we can throw an object that carries
 * the same discriminator fields and spy on the code paths.
 *
 * We import the actual Prisma class so `instanceof` resolves correctly.
 */
import { Prisma } from "../../../../shared/lib/prisma/client.ts";
import { updateProfile } from "./update-profile.server";

// Pull the mocked Prisma client.
const mockedUpdate = vi.mocked(prisma.user.update);

function makePrismaError(
  code: string,
  meta: Record<string, unknown>
): Prisma.PrismaClientKnownRequestError {
  const err = Object.create(
    Prisma.PrismaClientKnownRequestError.prototype
  ) as Prisma.PrismaClientKnownRequestError;
  Object.defineProperties(err, {
    code: { value: code, writable: false, enumerable: true },
    meta: { value: meta, writable: false, enumerable: true },
    message: {
      value: `Prisma error ${code}`,
      writable: false,
      enumerable: true,
    },
    clientVersion: { value: "0.0.0", writable: false, enumerable: true },
  });
  return err;
}

describe("updateProfile — Prisma error mapping", () => {
  beforeEach(() => {
    mockedUpdate.mockReset();
  });

  describe("given prisma.user.update throws P2025 (TOCTOU race)", () => {
    beforeEach(() => {
      mockedUpdate.mockRejectedValue(
        makePrismaError("P2025", { cause: "Record to update not found" })
      );
    });

    it("re-throws as NotFoundError", async () => {
      await expect(
        updateProfile("user-abc", { name: "Alice" })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("given prisma.user.update throws P2002 with array meta.target (legacy Prisma format)", () => {
    beforeEach(() => {
      // Legacy Prisma format: meta.target is a string[] containing field names.
      mockedUpdate.mockRejectedValue(
        makePrismaError("P2002", {
          target: ["usernameNormalized"],
        })
      );
    });

    it("re-throws as ConflictError for username conflict", async () => {
      await expect(
        updateProfile("user-abc", { username: "takenname" })
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe("given prisma.user.update throws P2002 with string meta.target (single-field shape)", () => {
    beforeEach(() => {
      mockedUpdate.mockRejectedValue(
        makePrismaError("P2002", {
          target: "usernameNormalized",
        })
      );
    });

    it("re-throws as ConflictError for username conflict (string target)", async () => {
      await expect(
        updateProfile("user-abc", { username: "takenname" })
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe("given prisma.user.update throws P2002 with Prisma 7 driverAdapterError nested shape", () => {
    beforeEach(() => {
      mockedUpdate.mockRejectedValue(
        makePrismaError("P2002", {
          driverAdapterError: {
            cause: {
              constraint: {
                fields: ["usernameNormalized"],
              },
            },
          },
        })
      );
    });

    it("re-throws as ConflictError for username conflict (driver-adapter shape)", async () => {
      await expect(
        updateProfile("user-abc", { username: "takenname" })
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe("given prisma.user.update throws P2002 targeting a non-username field (other unique constraint)", () => {
    beforeEach(() => {
      mockedUpdate.mockRejectedValue(
        makePrismaError("P2002", {
          target: "email",
        })
      );
    });

    it("re-throws the raw Prisma error without wrapping (not a username conflict)", async () => {
      await expect(
        updateProfile("user-abc", { name: "Alice" })
      ).rejects.toMatchObject({ code: "P2002" });
    });
  });

  describe("given prisma.user.update throws a non-P2025 non-P2002 Prisma error", () => {
    beforeEach(() => {
      // P2003 = foreign key constraint — not handled, should re-throw raw.
      mockedUpdate.mockRejectedValue(
        makePrismaError("P2003", { field_name: "some_fk" })
      );
    });

    it("re-throws the error without wrapping it", async () => {
      await expect(
        updateProfile("user-abc", { name: "Alice" })
      ).rejects.toMatchObject({ code: "P2003" });
    });
  });

  describe("given prisma.user.update throws P2002 with null meta (targetsUsername null-guard path)", () => {
    beforeEach(() => {
      // Simulate a P2002 error where meta is null (defensive guard in targetsUsername).
      const err = Object.create(
        Prisma.PrismaClientKnownRequestError.prototype
      ) as Prisma.PrismaClientKnownRequestError;
      Object.defineProperties(err, {
        code: { value: "P2002", writable: false, enumerable: true },
        meta: { value: null, writable: false, enumerable: true },
        message: {
          value: "Prisma error P2002",
          writable: false,
          enumerable: true,
        },
        clientVersion: { value: "0.0.0", writable: false, enumerable: true },
      });
      mockedUpdate.mockRejectedValue(err);
    });

    it("re-throws the raw error when meta is null (not a known username constraint)", async () => {
      // targetsUsername(null) returns false → the error is not a ConflictError
      await expect(
        updateProfile("user-abc", { username: "anyname" })
      ).rejects.toMatchObject({ code: "P2002" });
    });
  });
});
