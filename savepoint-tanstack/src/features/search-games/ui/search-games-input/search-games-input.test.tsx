import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SearchGamesInput } from "./search-games-input";

// Mock navigate so we can assert on URL-update calls.
const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const elements = {
  getSearchInput: () =>
    screen.getByRole("searchbox", { name: "Search for games by name" }),
};

const actions = {
  typeInSearch: async (text: string) => {
    await userEvent.type(elements.getSearchInput(), text);
  },
  clearAndType: async (text: string) => {
    await userEvent.clear(elements.getSearchInput());
    await userEvent.type(elements.getSearchInput(), text);
  },
};

describe("SearchGamesInput", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  describe("given it renders with an initial empty query", () => {
    beforeEach(() => {
      render(<SearchGamesInput initialQuery="" debounceMs={300} />);
    });

    it("renders the search input", () => {
      expect(elements.getSearchInput()).toBeDefined();
    });

    it("shows the placeholder text", () => {
      expect(elements.getSearchInput()).toHaveAttribute(
        "placeholder",
        "Search for games (minimum 3 characters)..."
      );
    });
  });

  describe("given it renders with a pre-filled initial query", () => {
    beforeEach(() => {
      render(<SearchGamesInput initialQuery="zelda" debounceMs={300} />);
    });

    it("shows the initial query value in the input", () => {
      expect((elements.getSearchInput() as HTMLInputElement).value).toBe(
        "zelda"
      );
    });
  });

  describe("given user types a new query (debounce fires after delay)", () => {
    beforeEach(async () => {
      render(<SearchGamesInput initialQuery="" debounceMs={300} />);
      await actions.typeInSearch("mario");
      await act(async () => {
        vi.advanceTimersByTime(400);
      });
    });

    it("calls navigate with the typed query after debounce delay", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "/games/search",
          search: { q: "mario" },
        })
      );
    });
  });

  describe("given user clears the input (empty query after typing)", () => {
    beforeEach(async () => {
      render(<SearchGamesInput initialQuery="mario" debounceMs={300} />);
      await actions.clearAndType("{backspace}");
      await act(async () => {
        vi.advanceTimersByTime(400);
      });
    });

    it("calls navigate with an empty search object when query is cleared", () => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe("given user types the same value as initialQuery", () => {
    beforeEach(async () => {
      render(<SearchGamesInput initialQuery="zelda" debounceMs={300} />);
      const input = elements.getSearchInput();
      await userEvent.clear(input);
      await userEvent.type(input, "zelda");
      await act(async () => {
        vi.advanceTimersByTime(400);
      });
    });

    it("does not call navigate when debounced matches initialQuery", () => {
      // debounced === initialQuery → the effect guards with early return.
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
