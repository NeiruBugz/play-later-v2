import { describe, expect, it } from "vitest";

import { extraOriginsSchema } from "./extra-origins";

describe("extraOriginsSchema", () => {
  it("splits a comma list and trims entries", () => {
    expect(
      extraOriginsSchema.parse("https://a.test, https://b.test:8443 ")
    ).toEqual(["https://a.test", "https://b.test:8443"]);
  });

  it("reduces entries to their origin", () => {
    expect(extraOriginsSchema.parse("https://a.test/path/?x=1")).toEqual([
      "https://a.test",
    ]);
  });

  it("rejects an entry that is not a URL", () => {
    expect(extraOriginsSchema.safeParse("https://a.test,nope").success).toBe(
      false
    );
  });
});

describe("extraOriginsSchema edge inputs", () => {
  it("yields no origins for an empty value", () => {
    expect(extraOriginsSchema.parse("")).toEqual([]);
  });

  it("yields no origins for blanks and stray commas", () => {
    expect(extraOriginsSchema.parse(" , ,")).toEqual([]);
  });

  it("names the offending entry in the error", () => {
    const result = extraOriginsSchema.safeParse("https://a.test,nope");
    expect(result.error?.issues[0]?.message).toContain("nope");
  });
});
