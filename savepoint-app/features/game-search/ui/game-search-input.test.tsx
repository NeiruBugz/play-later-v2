import { renderWithTestProviders } from "@/test/utils/test-provider";
import { gameSearchHandlers } from "@fixtures/game-search";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupServer } from "msw/node";
import { useRouter } from "next/navigation";

import { GameSearchInput } from "./game-search-input";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

const server = setupServer(...gameSearchHandlers);

const mockReplace = vi.fn();
const mockRouter = {
  push: vi.fn(),
  replace: mockReplace,
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue(mockRouter);
});
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

describe("GameSearchInput", () => {
  describe("when user opens the search page", () => {
    it("should display empty search input with placeholder", () => {
      renderWithTestProviders(<GameSearchInput />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );
      expect(input).toBeVisible();
      expect(input).toHaveValue("");
    });

    it("should not show results initially", () => {
      renderWithTestProviders(<GameSearchInput />);

      expect(screen.queryByText(/Legend of Zelda/i)).not.toBeInTheDocument();
    });
  });

  describe("when user starts typing in search field", () => {
    it("should not trigger search for 1-2 characters", async () => {
      renderWithTestProviders(<GameSearchInput />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );

      await userEvent.type(input, "ze");

      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(screen.queryByText(/Legend of Zelda/i)).not.toBeInTheDocument();
    });

    it("should debounce search input", async () => {
      renderWithTestProviders(<GameSearchInput />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );

      await userEvent.type(input, "zelda");

      expect(screen.queryByText(/Legend of Zelda/i)).not.toBeInTheDocument();

      await waitFor(
        () => {
          expect(
            screen.getByText(/The Legend of Zelda: Breath of the Wild/i)
          ).toBeVisible();
        },
        { timeout: 2000 }
      );
    });

    it("should trigger search after debounce delay for ≥3 characters", async () => {
      renderWithTestProviders(<GameSearchInput />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );

      await userEvent.type(input, "zelda");

      await waitFor(
        () => {
          expect(
            screen.getByText(/The Legend of Zelda: Breath of the Wild/i)
          ).toBeVisible();
          expect(
            screen.getByText(/The Legend of Zelda: Ocarina of Time/i)
          ).toBeVisible();
        },
        { timeout: 2000 }
      );
    });

    it("should cancel previous search when user continues typing", async () => {
      renderWithTestProviders(<GameSearchInput />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );

      await userEvent.type(input, "zel");
      await new Promise((resolve) => setTimeout(resolve, 200));

      await userEvent.type(input, "da");

      await waitFor(
        () => {
          expect(
            screen.getByText(/The Legend of Zelda: Breath of the Wild/i)
          ).toBeVisible();
        },
        { timeout: 2000 }
      );
    });
  });

  describe("when user modifies their search", () => {
    it("should hide results when query drops below 3 characters", async () => {
      renderWithTestProviders(<GameSearchInput />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );

      await userEvent.type(input, "zelda");

      await waitFor(
        () => {
          expect(
            screen.getByText(/The Legend of Zelda: Breath of the Wild/i)
          ).toBeVisible();
        },
        { timeout: 2000 }
      );

      await userEvent.clear(input);
      await userEvent.type(input, "ze");

      await waitFor(
        () => {
          expect(
            screen.queryByText(/The Legend of Zelda: Breath of the Wild/i)
          ).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it("should show new results when user changes search term", async () => {
      renderWithTestProviders(<GameSearchInput />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );

      await userEvent.type(input, "zelda");

      await waitFor(
        () => {
          expect(
            screen.getByText(/The Legend of Zelda: Breath of the Wild/i)
          ).toBeVisible();
        },
        { timeout: 2000 }
      );

      await userEvent.clear(input);
      await userEvent.type(input, "mario");

      await waitFor(
        () => {
          expect(screen.getByText(/Super Mario Odyssey/i)).toBeVisible();
        },
        { timeout: 2000 }
      );

      expect(
        screen.queryByText(/The Legend of Zelda: Breath of the Wild/i)
      ).not.toBeInTheDocument();
    });

    it("should clear results when user empties the input", async () => {
      renderWithTestProviders(<GameSearchInput />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );

      await userEvent.type(input, "zelda");

      await waitFor(
        () => {
          expect(
            screen.getByText(/The Legend of Zelda: Breath of the Wild/i)
          ).toBeVisible();
        },
        { timeout: 2000 }
      );

      await userEvent.clear(input);

      await waitFor(
        () => {
          expect(
            screen.queryByText(/The Legend of Zelda: Breath of the Wild/i)
          ).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe("when initialQuery prop is provided", () => {
    it("should pre-populate search input with initial query", () => {
      renderWithTestProviders(<GameSearchInput initialQuery="zelda" />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );
      expect(input).toHaveValue("zelda");
    });

    it("should trigger search automatically for initialQuery ≥3 characters", async () => {
      renderWithTestProviders(<GameSearchInput initialQuery="zelda" />);

      await waitFor(
        () => {
          expect(
            screen.getByText(/The Legend of Zelda: Breath of the Wild/i)
          ).toBeVisible();
        },
        { timeout: 2000 }
      );
    });

    it("should not trigger search for initialQuery <3 characters", async () => {
      renderWithTestProviders(<GameSearchInput initialQuery="ze" />);

      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(screen.queryByText(/Legend of Zelda/i)).not.toBeInTheDocument();
    });

    it("should allow user to modify pre-populated query", async () => {
      renderWithTestProviders(<GameSearchInput initialQuery="zelda" />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );

      await userEvent.clear(input);
      await userEvent.type(input, "mario");

      await waitFor(
        () => {
          expect(screen.getByText(/Super Mario Odyssey/i)).toBeVisible();
        },
        { timeout: 2000 }
      );

      expect(
        screen.queryByText(/The Legend of Zelda: Breath of the Wild/i)
      ).not.toBeInTheDocument();
    });

    it("should handle empty initialQuery gracefully", () => {
      renderWithTestProviders(<GameSearchInput initialQuery="" />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );
      expect(input).toHaveValue("");
    });

    it("should clean up URL when user modifies query", async () => {
      renderWithTestProviders(<GameSearchInput initialQuery="zelda" />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );

      await userEvent.type(input, "a");

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/games/search", {
          scroll: false,
        });
      });
    });

    it("should not clean up URL if no initialQuery was provided", async () => {
      renderWithTestProviders(<GameSearchInput />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );

      await userEvent.type(input, "zelda");

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});
