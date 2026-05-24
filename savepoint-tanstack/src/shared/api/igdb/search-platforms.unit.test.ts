import { beforeEach, describe, expect, it, vi } from "vitest";

import { UpstreamError } from "@/shared/lib/errors";

import { igdbFetch } from "./fetch";
import { searchIgdbPlatforms } from "./search-platforms";

vi.mock("./fetch", () => ({
  igdbFetch: vi.fn(),
}));

vi.mock("@/shared/lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/lib")>();
  const stub = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
  };
  stub.child = vi.fn(() => stub);
  return { ...actual, createLogger: vi.fn(() => stub) };
});

const igdbFetchMock = igdbFetch as ReturnType<typeof vi.fn>;

describe(searchIgdbPlatforms, () => {
  beforeEach(() => {
    igdbFetchMock.mockReset();
  });

  describe("given IGDB returns platform matches", () => {
    beforeEach(() => {
      igdbFetchMock.mockResolvedValue([
        { id: 1, name: "PlayStation 5" },
        { id: 2, name: "PlayStation 4" },
        { id: 3 },
        { id: 4, name: "PlayStation 5" },
      ]);
    });

    it("returns the canonical names in IGDB relevance order, deduped, dropping nameless entries", async () => {
      const result = await searchIgdbPlatforms("playstation");
      expect(result).toEqual(["PlayStation 5", "PlayStation 4"]);
    });

    it("queries the /platforms endpoint with a search clause", async () => {
      await searchIgdbPlatforms("playstation");
      const [resource, body] = igdbFetchMock.mock.calls[0] ?? [];
      expect(resource).toBe("/platforms");
      expect(body).toContain('search "playstation";');
      expect(body).toContain("fields name;");
      expect(body).toContain("limit 8;");
    });

    it("strips double-quotes from the user query so the IGDB string is not broken", async () => {
      await searchIgdbPlatforms('play"station');
      const [, body] = igdbFetchMock.mock.calls[0] ?? [];
      expect(body).toContain('search "playstation";');
    });
  });

  describe("given an empty query", () => {
    it("returns an empty array without calling IGDB", async () => {
      const result = await searchIgdbPlatforms("   ");
      expect(result).toEqual([]);
      expect(igdbFetchMock).not.toHaveBeenCalled();
    });
  });

  describe("given IGDB transport throws", () => {
    beforeEach(() => {
      igdbFetchMock.mockRejectedValue(new Error("network down"));
    });

    it("wraps the failure in UpstreamError", async () => {
      await expect(searchIgdbPlatforms("switch")).rejects.toBeInstanceOf(
        UpstreamError
      );
    });
  });

  describe("given IGDB returns a malformed response", () => {
    beforeEach(() => {
      igdbFetchMock.mockResolvedValue({ not: "an array" });
    });

    it("throws UpstreamError", async () => {
      await expect(searchIgdbPlatforms("switch")).rejects.toBeInstanceOf(
        UpstreamError
      );
    });
  });
});
