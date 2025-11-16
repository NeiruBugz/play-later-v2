import { parseListParams, updateListParams } from "./url-params";

describe("url-params helpers", () => {
  it("parses common list params", () => {
    const sp = new URLSearchParams(
      "page=3&search=zelda&sort=name&order=asc&platform=STEAM&status=WISHLIST"
    );
    const parsed = parseListParams(sp);
    expect(parsed).toMatchObject({
      page: 3,
      search: "zelda",
      sort: "name",
      order: "asc",
      platform: "STEAM",
      status: "WISHLIST",
    });
  });

  it("updates params by setting and deleting keys", () => {
    const sp = new URLSearchParams("page=2&search=foo");
    const next = updateListParams(sp, {
      page: 1,
      search: "",
      sort: "createdAt",
    });
    expect(next.get("page")).toBe("1");
    expect(next.get("search")).toBeNull();
    expect(next.get("sort")).toBe("createdAt");
  });
});
