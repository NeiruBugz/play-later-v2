import { describe, expect, it } from "vitest";

import { convertReleaseDateToIsoStringDate } from "./date-functions";

describe("convertReleaseDateToIsoStringDate", () => {
  it("should convert a release date to an ISO string date", () => {
    const releaseDate = "2024";
    const result = convertReleaseDateToIsoStringDate(releaseDate);
    expect(result).toBe("2024-12-31T19:59:59.999Z");
  });
});
