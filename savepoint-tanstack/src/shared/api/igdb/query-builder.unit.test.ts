import { describe, expect, it } from "vitest";

import { escapeIgdbString, QueryBuilder } from "./query-builder";

describe("QueryBuilder.search", () => {
  describe("given a plain term", () => {
    it("quotes the term", () => {
      expect(new QueryBuilder().search("zelda").build()).toBe(
        'search "zelda";'
      );
    });
  });

  describe("given a term with a double quote", () => {
    it("escapes the quote so the term stays one string", () => {
      expect(new QueryBuilder().search('the "best" game').build()).toBe(
        'search "the \\"best\\" game";'
      );
    });
  });

  describe("given a term that tries to close the string and add a clause", () => {
    it("keeps the clause inside the search string", () => {
      const query = new QueryBuilder()
        .search('x"; limit 500; fields *; where id > 0')
        .limit(10)
        .build();

      expect(query).toBe(
        'search "x\\"; limit 500; fields *; where id > 0";limit 10;'
      );
    });
  });

  describe("given a term ending in a backslash", () => {
    it("escapes the backslash so it cannot escape the closing quote", () => {
      expect(new QueryBuilder().search("half-life\\").build()).toBe(
        'search "half-life\\\\";'
      );
    });
  });
});

describe("escapeIgdbString", () => {
  it("escapes backslashes before quotes", () => {
    expect(escapeIgdbString('a\\"b')).toBe('a\\\\\\"b');
  });
});
