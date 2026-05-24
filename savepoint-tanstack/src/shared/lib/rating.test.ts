import { describe, expect, it } from "vitest";

import { ratingStarsToStorage, ratingStorageToStars } from "./rating";

describe("rating unit conversions", () => {
  describe("ratingStarsToStorage", () => {
    it("maps whole stars to even storage ints", () => {
      expect(ratingStarsToStorage(5)).toBe(10);
      expect(ratingStarsToStorage(3)).toBe(6);
    });

    it("maps half stars to odd storage ints", () => {
      expect(ratingStarsToStorage(3.5)).toBe(7);
      expect(ratingStarsToStorage(0.5)).toBe(1);
    });
  });

  describe("ratingStorageToStars", () => {
    it("maps storage ints back to stars", () => {
      expect(ratingStorageToStars(10)).toBe(5);
      expect(ratingStorageToStars(7)).toBe(3.5);
      expect(ratingStorageToStars(1)).toBe(0.5);
    });
  });

  it("round-trips every storage value through stars without drift", () => {
    for (let storage = 1; storage <= 10; storage += 1) {
      expect(ratingStarsToStorage(ratingStorageToStars(storage))).toBe(storage);
    }
  });
});
