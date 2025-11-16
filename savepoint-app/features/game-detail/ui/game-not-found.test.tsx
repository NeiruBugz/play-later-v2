import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";

import { GameNotFound } from "./game-not-found";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock BrowserBackButton component
vi.mock("@/shared/components/browser-back-button", () => ({
  BrowserBackButton: () => <button>Back</button>,
}));

describe("GameNotFound", () => {
  const mockPush = vi.fn();
  const mockRouter = {
    push: mockPush,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter);
  });

  it("renders the not found heading", () => {
    render(<GameNotFound />);

    expect(
      screen.getByRole("heading", {
        name: /this game doesn't exist in our database/i,
      })
    ).toBeVisible();
  });

  it("displays appropriate error message", () => {
    render(<GameNotFound />);

    expect(
      screen.getByText(/the game you're looking for might have been removed/i)
    ).toBeVisible();
  });

  it("renders a search input", () => {
    render(<GameNotFound />);

    const searchInput = screen.getByLabelText(/search for games by name/i);
    expect(searchInput).toBeVisible();
    expect(searchInput).toHaveAttribute("type", "search");
  });

  it("renders navigation links", () => {
    render(<GameNotFound />);

    expect(
      screen.getByRole("link", { name: /browse all games/i })
    ).toHaveAttribute("href", "/games/search");
    expect(
      screen.getByRole("link", { name: /head back home/i })
    ).toHaveAttribute("href", "/");
  });

  it("disables search button when query is less than 3 characters", async () => {
    render(<GameNotFound />);

    const searchInput = screen.getByLabelText(/search for games by name/i);
    const searchButton = screen.getByRole("button", { name: /search/i });

    // Initially disabled (empty)
    expect(searchButton).toBeDisabled();

    // Type 2 characters - still disabled
    await userEvent.type(searchInput, "ab");
    expect(searchButton).toBeDisabled();
  });

  it("enables search button when query is 3+ characters", async () => {
    render(<GameNotFound />);

    const searchInput = screen.getByLabelText(/search for games by name/i);
    const searchButton = screen.getByRole("button", { name: /search/i });

    await userEvent.type(searchInput, "zelda");

    expect(searchButton).toBeEnabled();
  });

  it("shows validation message when typing less than 3 characters", async () => {
    render(<GameNotFound />);

    const searchInput = screen.getByLabelText(/search for games by name/i);

    await userEvent.type(searchInput, "ab");

    expect(
      screen.getByText(/please enter at least 3 characters to search/i)
    ).toBeVisible();
  });

  it("hides validation message when query is empty", () => {
    render(<GameNotFound />);

    expect(
      screen.queryByText(/please enter at least 3 characters to search/i)
    ).not.toBeInTheDocument();
  });

  it("hides validation message when query is 3+ characters", async () => {
    render(<GameNotFound />);

    const searchInput = screen.getByLabelText(/search for games by name/i);

    await userEvent.type(searchInput, "zelda");

    expect(
      screen.queryByText(/please enter at least 3 characters to search/i)
    ).not.toBeInTheDocument();
  });

  it("navigates to search page with query on form submit", async () => {
    render(<GameNotFound />);

    const searchInput = screen.getByLabelText(/search for games by name/i);
    const searchButton = screen.getByRole("button", { name: /search/i });

    await userEvent.type(searchInput, "zelda");
    await userEvent.click(searchButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/games/search?q=zelda");
    });
  });

  it("trims whitespace from search query", async () => {
    render(<GameNotFound />);

    const searchInput = screen.getByLabelText(/search for games by name/i);
    const searchButton = screen.getByRole("button", { name: /search/i });

    await userEvent.type(searchInput, "  zelda  ");
    await userEvent.click(searchButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/games/search?q=zelda");
    });
  });

  it("URL-encodes special characters in search query", async () => {
    render(<GameNotFound />);

    const searchInput = screen.getByLabelText(/search for games by name/i);
    const searchButton = screen.getByRole("button", { name: /search/i });

    await userEvent.type(searchInput, "mario & luigi");
    await userEvent.click(searchButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/games/search?q=mario%20%26%20luigi"
      );
    });
  });

  it("does not submit form with less than 3 characters", async () => {
    render(<GameNotFound />);

    const searchInput = screen.getByLabelText(/search for games by name/i);

    await userEvent.type(searchInput, "ab");
    await userEvent.keyboard("{Enter}");

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("has proper accessibility attributes", () => {
    render(<GameNotFound />);

    const searchInput = screen.getByLabelText(/search for games by name/i);
    expect(searchInput).toHaveAttribute(
      "aria-label",
      "Search for games by name"
    );
  });

  it("renders back button from BrowserBackButton component", () => {
    render(<GameNotFound />);

    expect(screen.getByRole("button", { name: /back/i })).toBeVisible();
  });

  describe("with initialQuery prop", () => {
    it("pre-populates search input with initial query", () => {
      render(<GameNotFound initialQuery="the legend of zelda" />);

      const searchInput = screen.getByLabelText(/search for games by name/i);
      expect(searchInput).toHaveValue("the legend of zelda");
    });

    it("enables search button when initialQuery is 3+ characters", () => {
      render(<GameNotFound initialQuery="zelda" />);

      const searchButton = screen.getByRole("button", { name: /search/i });
      expect(searchButton).toBeEnabled();
    });

    it("allows user to modify pre-populated query", async () => {
      render(<GameNotFound initialQuery="zelda" />);

      const searchInput = screen.getByLabelText(/search for games by name/i);

      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, "mario");

      expect(searchInput).toHaveValue("mario");
    });

    it("navigates with modified query on submit", async () => {
      render(<GameNotFound initialQuery="zelda" />);

      const searchInput = screen.getByLabelText(/search for games by name/i);
      const searchButton = screen.getByRole("button", { name: /search/i });

      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, "mario");
      await userEvent.click(searchButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/games/search?q=mario");
      });
    });

    it("handles empty initialQuery gracefully", () => {
      render(<GameNotFound initialQuery="" />);

      const searchInput = screen.getByLabelText(/search for games by name/i);
      expect(searchInput).toHaveValue("");

      const searchButton = screen.getByRole("button", { name: /search/i });
      expect(searchButton).toBeDisabled();
    });
  });
});
