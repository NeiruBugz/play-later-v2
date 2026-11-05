import { describe, expect, it } from "vitest";

import { getDisplayName } from "./display-name";

describe("getDisplayName", () => {
  describe("given a chosen name", () => {
    it("shows the name", () => {
      expect(getDisplayName({ name: "Nail", username: "nail" }, "User")).toBe(
        "Nail"
      );
    });
  });

  describe("given an email-shaped legacy name", () => {
    it("shows the username instead", () => {
      expect(
        getDisplayName({ name: "nail@example.com", username: "nail" }, "User")
      ).toBe("nail");
    });

    it("shows the fallback when there is no username", () => {
      expect(
        getDisplayName({ name: "nail@example.com", username: null }, "Account")
      ).toBe("Account");
    });
  });

  describe("given neither a name nor a username", () => {
    it("shows the fallback", () => {
      expect(getDisplayName({ name: null, username: null }, "User")).toBe(
        "User"
      );
    });
  });

  describe("given a blank name", () => {
    it("shows the username instead", () => {
      expect(getDisplayName({ name: "  ", username: "nail" }, "User")).toBe(
        "nail"
      );
    });
  });
});
