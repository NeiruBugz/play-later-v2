// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  createSteamLoginState,
  isValidSteamLoginState,
} from "./login-state.server";

const SECRET = "unit-test-secret";
const NOW = 1_700_000_000_000;
const TEN_MINUTES_MS = 10 * 60 * 1000;

describe("Steam login state", () => {
  describe("given a state issued for a user", () => {
    const state = createSteamLoginState({
      userId: "user-a",
      secret: SECRET,
      now: NOW,
    });

    it("is accepted for the same user within the time-to-live", () => {
      expect(
        isValidSteamLoginState({
          state,
          userId: "user-a",
          secret: SECRET,
          now: NOW + TEN_MINUTES_MS - 1,
        })
      ).toBe(true);
    });

    it("is rejected for a different user", () => {
      expect(
        isValidSteamLoginState({
          state,
          userId: "user-b",
          secret: SECRET,
          now: NOW,
        })
      ).toBe(false);
    });

    it("is rejected once expired", () => {
      expect(
        isValidSteamLoginState({
          state,
          userId: "user-a",
          secret: SECRET,
          now: NOW + TEN_MINUTES_MS + 1,
        })
      ).toBe(false);
    });

    it("is rejected when signed with a different secret", () => {
      expect(
        isValidSteamLoginState({
          state,
          userId: "user-a",
          secret: "another-secret",
          now: NOW,
        })
      ).toBe(false);
    });

    it("is rejected when the expiry is tampered with", () => {
      const [, signature] = state.split(".");
      const forged = `${NOW + 10 * TEN_MINUTES_MS}.${signature}`;
      expect(
        isValidSteamLoginState({
          state: forged,
          userId: "user-a",
          secret: SECRET,
          now: NOW,
        })
      ).toBe(false);
    });
  });

  describe("given malformed state values", () => {
    it.each(["", "garbage", "123.", ".abc", "a.b.c", "abc.def"])(
      "rejects %j",
      (state) => {
        expect(
          isValidSteamLoginState({
            state,
            userId: "user-a",
            secret: SECRET,
            now: NOW,
          })
        ).toBe(false);
      }
    );
  });
});
