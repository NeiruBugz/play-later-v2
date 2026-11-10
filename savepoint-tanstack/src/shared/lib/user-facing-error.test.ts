import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  UpstreamError,
  ValidationError,
} from "./errors";
import {
  getUserFacingErrorMessage,
  SAVE_FAILED_MESSAGE,
} from "./user-facing-error";

const RAW_PRISMA_TEXT =
  "Invalid `prisma.libraryItem.update()` invocation: P2002 Unique constraint failed";

describe("getUserFacingErrorMessage", () => {
  describe("given a rate-limited ValidationError", () => {
    it("tells the user to wait and try again", () => {
      const message = getUserFacingErrorMessage(
        new ValidationError("raw: limit", { code: "RATE_LIMITED" })
      );
      expect(message).toBe("Too many searches. Wait a moment and try again.");
    });
  });

  describe("given an AppError", () => {
    it.each([
      ["NotFoundError", new NotFoundError("raw: item 7 missing")],
      ["ValidationError", new ValidationError("raw: bad payload")],
      ["UnauthorizedError", new UnauthorizedError("raw: no session")],
    ])("maps %s to copy that does not echo its message", (_name, error) => {
      const message = getUserFacingErrorMessage(error);
      expect(message).not.toContain("raw:");
      expect(message).not.toBe(SAVE_FAILED_MESSAGE);
    });

    it("maps upstream and generic conflicts to the save-failed copy", () => {
      expect(getUserFacingErrorMessage(new UpstreamError("IGDB 500"))).toBe(
        SAVE_FAILED_MESSAGE
      );
      expect(getUserFacingErrorMessage(new ConflictError("dup"))).toBe(
        SAVE_FAILED_MESSAGE
      );
    });

    it("maps a conflict with a specific sub-code to its own copy", () => {
      const error = new ConflictError("raw: queue at 5", {
        code: "UP_NEXT_FULL",
      });
      expect(getUserFacingErrorMessage(error)).toBe(
        "Up Next holds 5 games. Remove one to add this."
      );
    });
  });

  describe("given time logged without a game", () => {
    it("maps the TIME_NEEDS_GAME validation to its own copy", () => {
      const error = new ValidationError("raw: no game", {
        code: "TIME_NEEDS_GAME",
      });
      expect(getUserFacingErrorMessage(error)).toBe(
        "Choose a game to log time."
      );
    });
  });

  describe("given an undo that is no longer available", () => {
    it("maps the UNDO_ADD_UNAVAILABLE conflict to its own copy", () => {
      const error = new ConflictError("raw: too old", {
        code: "UNDO_ADD_UNAVAILABLE",
      });
      expect(getUserFacingErrorMessage(error)).toBe(
        "This game can't be undone anymore. Remove it from your library instead."
      );
    });
  });

  describe("given an AppError that crossed createServerFn serialization", () => {
    it("still maps by the surviving code property although it is a plain Error", () => {
      const revived = Object.assign(new Error("raw: item 7 missing"), {
        name: "NotFoundError",
        code: "NOT_FOUND",
      });
      const message = getUserFacingErrorMessage(revived);
      expect(message).not.toContain("raw:");
      expect(message).not.toBe(SAVE_FAILED_MESSAGE);
    });
  });

  describe("given non-AppError failures", () => {
    it("never returns raw ZodError text", () => {
      const zodError = new ZodError([
        { code: "custom", path: ["content"], message: "raw zod text" },
      ]);
      expect(getUserFacingErrorMessage(zodError)).toBe(SAVE_FAILED_MESSAGE);
    });

    it("never returns raw Prisma text", () => {
      expect(getUserFacingErrorMessage(new Error(RAW_PRISMA_TEXT))).toBe(
        SAVE_FAILED_MESSAGE
      );
    });

    it("maps a network failure to the save-failed copy", () => {
      expect(getUserFacingErrorMessage(new TypeError("Failed to fetch"))).toBe(
        SAVE_FAILED_MESSAGE
      );
    });

    it.each([["string rejection"], [undefined], [null], [{ code: 42 }]])(
      "maps %j to the save-failed copy",
      (value) => {
        expect(getUserFacingErrorMessage(value)).toBe(SAVE_FAILED_MESSAGE);
      }
    );
  });
});
