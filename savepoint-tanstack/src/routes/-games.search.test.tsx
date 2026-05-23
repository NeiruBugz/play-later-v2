import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Route } from "./games.search";

vi.mock("@/features/search-games", () => ({
  SearchGamesInput: ({ initialQuery }: { initialQuery: string }) => (
    <input
      aria-label="Search for games by name"
      defaultValue={initialQuery}
      type="search"
    />
  ),
  SearchGamesResults: ({ query }: { query: string }) => (
    <div data-testid="search-results">{query}</div>
  ),
}));

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual<typeof import("@tanstack/react-router")>(
    "@tanstack/react-router"
  )),
  createFileRoute: () => (opts: unknown) => ({
    options: opts,
    useSearch: vi.fn(),
  }),
}));

const elements = {
  getHeading: () => screen.getByRole("heading", { name: "Search Games" }),
  getSearchInput: () =>
    screen.getByRole("searchbox", { name: "Search for games by name" }),
  queryResults: () => screen.queryByTestId("search-results"),
  getEmptyPrompt: () => screen.getByText("Start typing to search for games..."),
};

function renderRoute(search: { q?: string }) {
  (Route as unknown as { useSearch: () => { q?: string } }).useSearch = () =>
    search;
  const Component = Route.options.component as ComponentType;
  render(<Component />);
}

describe("/games/search route", () => {
  describe("given a request with no authenticated session", () => {
    beforeEach(() => {
      renderRoute({});
    });

    it("is a public route with no beforeLoad auth guard", () => {
      expect(Route.options.beforeLoad).toBeUndefined();
    });

    it("renders the search page for an anonymous visitor", () => {
      expect(elements.getHeading()).toBeDefined();
      expect(elements.getSearchInput()).toBeDefined();
    });

    it("shows the empty-query prompt when no query is present", () => {
      expect(elements.getEmptyPrompt()).toBeDefined();
      expect(elements.queryResults()).toBeNull();
    });
  });

  describe("given a query in the search params", () => {
    beforeEach(() => {
      renderRoute({ q: "celeste" });
    });

    it("renders search results for the query without requiring auth", () => {
      expect(elements.queryResults()?.textContent).toBe("celeste");
    });
  });

  describe("validateSearch", () => {
    it("accepts an optional q string", () => {
      const validateSearch = Route.options.validateSearch as (
        input: unknown
      ) => { q?: string };
      expect(validateSearch({ q: "halo" })).toEqual({ q: "halo" });
      expect(validateSearch({})).toEqual({});
    });
  });
});
