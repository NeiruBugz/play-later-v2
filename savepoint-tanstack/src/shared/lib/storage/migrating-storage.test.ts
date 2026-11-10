import { beforeEach, describe, expect, it } from "vitest";

import { readMigratingItem, writeMigratingItem } from "./migrating-storage";

const NEW_KEY = "app:sidebar-collapsed";
const OLD_KEY = "sp:sidebar-collapsed";

describe("migrating storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("given only the old key holds a value", () => {
    beforeEach(() => {
      window.localStorage.setItem(OLD_KEY, "true");
    });

    it("reads the old value", () => {
      expect(readMigratingItem(NEW_KEY, OLD_KEY)).toBe("true");
    });

    it("moves the value to the new key and deletes the old one", () => {
      readMigratingItem(NEW_KEY, OLD_KEY);
      expect(window.localStorage.getItem(NEW_KEY)).toBe("true");
      expect(window.localStorage.getItem(OLD_KEY)).toBeNull();
    });
  });

  describe("given both keys hold a value", () => {
    beforeEach(() => {
      window.localStorage.setItem(OLD_KEY, "true");
      window.localStorage.setItem(NEW_KEY, "false");
    });

    it("prefers the new value", () => {
      expect(readMigratingItem(NEW_KEY, OLD_KEY)).toBe("false");
    });
  });

  describe("given neither key holds a value", () => {
    it("reads null", () => {
      expect(readMigratingItem(NEW_KEY, OLD_KEY)).toBeNull();
    });
  });

  describe("when a value is written", () => {
    beforeEach(() => {
      window.localStorage.setItem(OLD_KEY, "true");
      writeMigratingItem(NEW_KEY, OLD_KEY, "false");
    });

    it("stores it under the new key", () => {
      expect(window.localStorage.getItem(NEW_KEY)).toBe("false");
    });

    it("deletes the old key", () => {
      expect(window.localStorage.getItem(OLD_KEY)).toBeNull();
    });
  });
});
