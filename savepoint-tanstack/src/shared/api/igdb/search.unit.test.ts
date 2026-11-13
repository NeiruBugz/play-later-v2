import { beforeEach, describe, expect, it, vi } from "vitest";

import { igdbFetch } from "./fetch";
import { searchGames } from "./search";

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

function requestedFields(query: string): string[] {
  const fieldList = /fields([^;]+);/.exec(query)?.[1] ?? "";
  return fieldList.split(",").map((field) => field.trim());
}

describe(searchGames, () => {
  beforeEach(() => {
    igdbFetchMock.mockReset();
    igdbFetchMock.mockResolvedValue([]);
  });

  describe("given a search by name", () => {
    beforeEach(async () => {
      await searchGames({ name: "zelda" });
    });

    it("asks IGDB for the release date and how precisely it is known", () => {
      const [, query] = igdbFetchMock.mock.calls[0] ?? [];

      expect(requestedFields(query)).toEqual(
        expect.arrayContaining([
          "release_dates.date",
          "release_dates.date_format",
          "release_dates.y",
          "release_dates.m",
        ])
      );
    });
  });
});
