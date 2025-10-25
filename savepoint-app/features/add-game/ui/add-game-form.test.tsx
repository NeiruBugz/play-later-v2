import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";

import type { SearchResponse } from "@/shared/types";

import { addGameToLibraryAction } from "../server-actions/add-game-to-library";
import { AddGameForm } from "./add-game-form";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../server-actions/add-game-to-library", () => ({
  addGameToLibraryAction: vi.fn(),
}));

const mockUseRouter = vi.mocked(useRouter);
const mockAddGameToLibraryAction = vi.mocked(addGameToLibraryAction);

const createMockGame = (
  overrides?: Partial<SearchResponse>
): SearchResponse => ({
  id: 1234,
  name: "The Legend of Zelda: Breath of the Wild",
  category: 0,
  game_type: 0,
  first_release_date: 1488326400,
  cover: {
    id: 5678,
    image_id: "co1abc",
  },
  platforms: [
    { id: 130, name: "Nintendo Switch" },
    { id: 41, name: "Wii U" },
  ],
  ...overrides,
});

const elements = {
  getCard: () => screen.getByText(/Add .* to Library/i).closest("div"),
  getTitle: () => screen.getByText(/Add .* to Library/i),
  getDescription: () =>
    screen.getByText(/Configure how you want to track this game/i),
  getChangeGameButton: () =>
    screen.getByRole("button", { name: /change game/i }),
  getCancelButton: () => screen.getByRole("button", { name: /^cancel$/i }),
  getSubmitButton: () =>
    screen.getByRole("button", { name: /add to library/i }),
  getAddingButton: () => screen.getByRole("button", { name: /adding.../i }),
  getGameName: () =>
    screen.getByText("The Legend of Zelda: Breath of the Wild"),
  getReleaseDate: () => screen.getByText(/3\/1\/2017/),
  getPlatformBadge: (name: string) => screen.getByText(name),
  queryPlatformBadge: (name: string) => screen.queryByText(name),
  getStatusSelect: () => screen.getByLabelText("Status"),
  getPlatformSelect: () => screen.getByLabelText("Platform"),
  getAcquisitionTypeSelect: () => screen.getByLabelText("Acquisition Type"),
  getCoverImage: () => screen.getByAltText(/.*cover/i),
  getNoImagePlaceholder: () => screen.getByText("No image"),
  queryNoImagePlaceholder: () => screen.queryByText("No image"),
};

const actions = {
  clickChangeGame: async () => {
    const user = userEvent.setup();
    await user.click(elements.getChangeGameButton());
  },

  clickCancel: async () => {
    const user = userEvent.setup();
    await user.click(elements.getCancelButton());
  },

  submitForm: async () => {
    const user = userEvent.setup();
    await user.click(elements.getSubmitButton());
  },
};

describe("AddGameForm", () => {
  let mockRouter: { push: ReturnType<typeof vi.fn> };
  let mockOnCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRouter = {
      push: vi.fn(),
    };
    mockUseRouter.mockReturnValue(mockRouter as any);

    mockOnCancel = vi.fn();

    mockAddGameToLibraryAction.mockResolvedValue({
      success: true,
      gameId: "game-1",
    });
  });

  describe("given form just rendered", () => {
    it("should display form header with game name", () => {
      const game = createMockGame();
      render(<AddGameForm game={game} onCancel={mockOnCancel} />);

      expect(elements.getTitle()).toBeInTheDocument();
      expect(elements.getDescription()).toBeInTheDocument();
      expect(elements.getChangeGameButton()).toBeInTheDocument();
    });

    it("should display game information card", () => {
      const game = createMockGame();
      render(<AddGameForm game={game} onCancel={mockOnCancel} />);

      expect(elements.getGameName()).toBeInTheDocument();
      expect(elements.getReleaseDate()).toBeInTheDocument();
    });

    it("should display game cover image when available", () => {
      const game = createMockGame();
      render(<AddGameForm game={game} onCancel={mockOnCancel} />);

      const coverImage = elements.getCoverImage();
      expect(coverImage).toBeInTheDocument();
      expect(coverImage).toHaveAttribute(
        "src",
        expect.stringContaining("co1abc")
      );
    });

    it("should display placeholder when cover image is missing", () => {
      const game = createMockGame({ cover: undefined });
      render(<AddGameForm game={game} onCancel={mockOnCancel} />);

      expect(elements.getNoImagePlaceholder()).toBeInTheDocument();
    });

    it("should display platform badges", () => {
      const game = createMockGame();
      const { container } = render(
        <AddGameForm game={game} onCancel={mockOnCancel} />
      );

      const badges = container.querySelectorAll(".rounded-full");
      expect(badges.length).toBeGreaterThan(0);
    });

    it("should limit platform badges to 5", () => {
      const game = createMockGame({
        platforms: [
          { id: 1, name: "Platform 1" },
          { id: 2, name: "Platform 2" },
          { id: 3, name: "Platform 3" },
          { id: 4, name: "Platform 4" },
          { id: 5, name: "Platform 5" },
          { id: 6, name: "Platform 6" },
          { id: 7, name: "Platform 7" },
        ],
      });
      render(<AddGameForm game={game} onCancel={mockOnCancel} />);

      expect(elements.getPlatformBadge("Platform 5")).toBeInTheDocument();
      expect(elements.queryPlatformBadge("Platform 6")).not.toBeInTheDocument();
      expect(elements.queryPlatformBadge("Platform 7")).not.toBeInTheDocument();
    });

    it("should handle game without platforms", () => {
      const game = createMockGame({ platforms: undefined });
      render(<AddGameForm game={game} onCancel={mockOnCancel} />);

      expect(elements.getGameName()).toBeInTheDocument();
    });

    it("should handle game without release date", () => {
      const game = createMockGame({ first_release_date: undefined });
      render(<AddGameForm game={game} onCancel={mockOnCancel} />);

      expect(screen.getByText("Release date unknown")).toBeInTheDocument();
    });

    it("should display all form fields", () => {
      const game = createMockGame();
      render(<AddGameForm game={game} onCancel={mockOnCancel} />);

      expect(elements.getStatusSelect()).toBeInTheDocument();
      expect(elements.getPlatformSelect()).toBeInTheDocument();
      expect(elements.getAcquisitionTypeSelect()).toBeInTheDocument();
    });

    it("should have default values set", () => {
      const game = createMockGame();
      render(<AddGameForm game={game} onCancel={mockOnCancel} />);

      expect(elements.getStatusSelect()).toHaveTextContent("Curious About");
      expect(elements.getAcquisitionTypeSelect()).toHaveTextContent("Digital");
    });

    it("should display cancel and submit buttons", () => {
      const game = createMockGame();
      render(<AddGameForm game={game} onCancel={mockOnCancel} />);

      expect(elements.getCancelButton()).toBeInTheDocument();
      expect(elements.getSubmitButton()).toBeInTheDocument();
    });
  });

  describe("given user clicks change game button", () => {
    it("should call onCancel callback", async () => {
      const game = createMockGame();
      render(<AddGameForm game={game} onCancel={mockOnCancel} />);

      await actions.clickChangeGame();

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("given user clicks cancel button", () => {
    it("should call onCancel callback", async () => {
      const game = createMockGame();
      render(<AddGameForm game={game} onCancel={mockOnCancel} />);

      await actions.clickCancel();

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("given form validation", () => {
    it("should require platform selection", async () => {
      const game = createMockGame();
      render(<AddGameForm game={game} onCancel={mockOnCancel} />);

      await actions.submitForm();

      await waitFor(() => {
        expect(screen.getByText("Platform is required")).toBeInTheDocument();
      });

      expect(mockAddGameToLibraryAction).not.toHaveBeenCalled();
    });
  });
});
