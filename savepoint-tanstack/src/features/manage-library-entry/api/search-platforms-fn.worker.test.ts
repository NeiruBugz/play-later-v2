import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchIgdbPlatforms } from "@/shared/api/igdb";
import { UnauthorizedError } from "@/shared/lib/errors";

import { searchPlatformsWorker } from "./search-platforms-fn.worker";

vi.mock("@/shared/api/igdb", () => ({
  searchIgdbPlatforms: vi.fn(),
}));

const searchIgdbPlatformsMock = vi.mocked(searchIgdbPlatforms);

const USER_ID = "user-abc";

describe(searchPlatformsWorker, () => {
  beforeEach(() => {
    searchIgdbPlatformsMock.mockReset();
  });

  describe("given no userId", () => {
    it("throws UnauthorizedError without calling IGDB", async () => {
      await expect(
        searchPlatformsWorker(undefined, { query: "switch" })
      ).rejects.toBeInstanceOf(UnauthorizedError);
      expect(searchIgdbPlatformsMock).not.toHaveBeenCalled();
    });
  });

  describe("given a query shorter than two characters", () => {
    it("returns an empty array without calling IGDB", async () => {
      const result = await searchPlatformsWorker(USER_ID, { query: "s" });
      expect(result).toEqual([]);
      expect(searchIgdbPlatformsMock).not.toHaveBeenCalled();
    });
  });

  describe("given a valid query", () => {
    beforeEach(() => {
      searchIgdbPlatformsMock.mockResolvedValue([
        "Nintendo Switch",
        "Nintendo Switch 2",
      ]);
    });

    it("returns the IGDB platform names", async () => {
      const result = await searchPlatformsWorker(USER_ID, { query: "switch" });
      expect(result).toEqual(["Nintendo Switch", "Nintendo Switch 2"]);
    });

    it("passes the query through to IGDB", async () => {
      await searchPlatformsWorker(USER_ID, { query: "switch" });
      expect(searchIgdbPlatformsMock).toHaveBeenCalledWith("switch");
    });
  });
});
