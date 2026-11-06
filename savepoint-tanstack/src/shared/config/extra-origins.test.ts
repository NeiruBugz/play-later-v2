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
