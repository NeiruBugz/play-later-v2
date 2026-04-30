import { describe, expect, it } from "vitest";

import { DomainError, ExternalServiceError } from "@/shared/lib/errors";

import { SteamApiUnavailableError, SteamProfilePrivateError } from "../errors";

const steamErrorSubclasses = [
  {
    Class: SteamProfilePrivateError,
    expectedName: "SteamProfilePrivateError",
  },
  {
    Class: SteamApiUnavailableError,
    expectedName: "SteamApiUnavailableError",
  },
] as const;

describe.each(steamErrorSubclasses)(
  "$expectedName",
  ({ Class, expectedName }) => {
    it("should be instanceof DomainError", () => {
      expect(new Class("msg")).toBeInstanceOf(DomainError);
    });

    it("should be instanceof Error", () => {
      expect(new Class("msg")).toBeInstanceOf(Error);
    });

    it("should be instanceof ExternalServiceError", () => {
      expect(new Class("msg")).toBeInstanceOf(ExternalServiceError);
    });

    it("should have correct name", () => {
      expect(new Class("msg").name).toBe(expectedName);
    });

    it("should preserve message", () => {
      expect(new Class("error message").message).toBe("error message");
    });

    it("should store context when provided", () => {
      const context = {
        steamId: "76561198012345678",
        operation: "getOwnedGames",
      };
      expect(new Class("msg", context).context).toEqual(context);
    });

    it("should have undefined context when not provided", () => {
      expect(new Class("msg").context).toBeUndefined();
    });

    it("should have a non-empty stack trace", () => {
      const error = new Class("msg");
      expect(error.stack).toBeTruthy();
      expect(typeof error.stack).toBe("string");
    });
  }
);
