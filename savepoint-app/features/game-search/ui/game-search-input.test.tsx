import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { GameSearchInput } from "./game-search-input";

const igdbHandlers = [
  http.get("*/api/games/search", ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    if (!query || query.length < 3) {
      return HttpResponse.json(
        { error: "Invalid search parameters" },
        { status: 400 }
      );
    }

    if (query === "zelda") {
      return HttpResponse.json({
        games: [
          {
            id: 1,
            name: "The Legend of Zelda: Breath of the Wild",
            game_type: 0,
            cover: { image_id: "co3p2d" },
            platforms: [{ name: "Nintendo Switch" }],
            first_release_date: 1488326400,
          },
          {
            id: 2,
            name: "The Legend of Zelda: Ocarina of Time",
            game_type: 0,
            cover: { image_id: "co1234" },
            platforms: [{ name: "Nintendo 64" }],
            first_release_date: 911606400,
          },
        ],
        count: 2,
      });
    }

    if (query === "mario") {
      return HttpResponse.json({
        games: [
          {
            id: 3,
            name: "Super Mario Odyssey",
            game_type: 0,
            cover: { image_id: "co5678" },
            platforms: [{ name: "Nintendo Switch" }],
            first_release_date: 1509062400,
          },
        ],
        count: 1,
      });
    }

    return HttpResponse.json({ games: [], count: 0 });
  }),
];

const server = setupServer(...igdbHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => server.close());

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("GameSearchInput", () => {
  describe("when user opens the search page", () => {
    it("should display empty search input with placeholder", () => {
      renderWithQueryClient(<GameSearchInput />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("");
    });

    it("should not show results initially", () => {
      renderWithQueryClient(<GameSearchInput />);

      expect(screen.queryByText(/Legend of Zelda/i)).not.toBeInTheDocument();
    });
  });

  describe("when user starts typing in search field", () => {
    it("should not trigger search for 1-2 characters", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<GameSearchInput />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );

      await user.type(input, "ze");

      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(screen.queryByText(/Legend of Zelda/i)).not.toBeInTheDocument();
    });

    it("should debounce search input", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<GameSearchInput />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );

      await user.type(input, "zelda");

      expect(screen.queryByText(/Legend of Zelda/i)).not.toBeInTheDocument();

      await waitFor(
        () => {
          expect(
            screen.getByText(/The Legend of Zelda: Breath of the Wild/i)
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it("should trigger search after debounce delay for ≥3 characters", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<GameSearchInput />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );

      await user.type(input, "zelda");

      await waitFor(
        () => {
          expect(
            screen.getByText(/The Legend of Zelda: Breath of the Wild/i)
          ).toBeInTheDocument();
          expect(
            screen.getByText(/The Legend of Zelda: Ocarina of Time/i)
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it("should cancel previous search when user continues typing", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<GameSearchInput />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );

      await user.type(input, "zel");
      await new Promise((resolve) => setTimeout(resolve, 200));

      await user.type(input, "da");

      await waitFor(
        () => {
          expect(
            screen.getByText(/The Legend of Zelda: Breath of the Wild/i)
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });

  describe("when user modifies their search", () => {
    it("should hide results when query drops below 3 characters", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<GameSearchInput />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );

      await user.type(input, "zelda");

      await waitFor(
        () => {
          expect(
            screen.getByText(/The Legend of Zelda: Breath of the Wild/i)
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      await user.clear(input);
      await user.type(input, "ze");

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
      const user = userEvent.setup();
      renderWithQueryClient(<GameSearchInput />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );

      await user.type(input, "zelda");

      await waitFor(
        () => {
          expect(
            screen.getByText(/The Legend of Zelda: Breath of the Wild/i)
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      await user.clear(input);
      await user.type(input, "mario");

      await waitFor(
        () => {
          expect(screen.getByText(/Super Mario Odyssey/i)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      expect(
        screen.queryByText(/The Legend of Zelda: Breath of the Wild/i)
      ).not.toBeInTheDocument();
    });

    it("should clear results when user empties the input", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<GameSearchInput />);

      const input = screen.getByPlaceholderText(
        /Search for games \(minimum 3 characters\)/i
      );

      await user.type(input, "zelda");

      await waitFor(
        () => {
          expect(
            screen.getByText(/The Legend of Zelda: Breath of the Wild/i)
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      await user.clear(input);

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
});
