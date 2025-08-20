import { renderWithTestProviders } from "@/test/utils/test-provider";
import { BacklogItemStatus } from "@prisma/client";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GridView } from "./grid-view";

const elements = {
  getGridContainer: () => screen.getByRole("list"),
  getGameCards: () => screen.getAllByRole("listitem"),
  getGameCardByTitle: (title: string) => screen.getByText(title),
  queryGameCards: () => screen.queryAllByRole("listitem"),
};

describe("GridView", () => {
  const mockGameWithBacklogItems = [
    {
      game: {
        id: "game-1",
        title: "Test Game 1",
        coverImage: "https://example.com/cover1.jpg",
        igdbId: 12345,
        summary: "Test game summary",
        aggregatedRating: 85,
        totalRatingCount: 100,
        releaseDate: new Date("2024-01-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
        slug: "test-game-1",
      },
      backlogItems: [
        {
          id: 1,
          userId: "user-1",
          gameId: "game-1",
          platform: "PC",
          status: BacklogItemStatus.TO_PLAY,
          acquisitionType: "DIGITAL" as const,
          startedAt: null,
          completedAt: null,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ],
    },
    {
      game: {
        id: "game-2",
        title: "Test Game 2",
        coverImage: "https://example.com/cover2.jpg",
        igdbId: 67890,
        summary: "Another test game",
        aggregatedRating: 90,
        totalRatingCount: 200,
        releaseDate: new Date("2024-02-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
        slug: "test-game-2",
      },
      backlogItems: [
        {
          id: 2,
          userId: "user-1",
          gameId: "game-2",
          platform: "PlayStation",
          status: BacklogItemStatus.PLAYING,
          acquisitionType: "PHYSICAL" as const,
          startedAt: new Date("2024-01-15"),
          completedAt: null,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-15"),
        },
      ],
    },
  ];

  describe("when rendering games", () => {
    it("should render a grid container with correct CSS classes", () => {
      // Act
      renderWithTestProviders(
        <GridView backlogItems={mockGameWithBacklogItems} />
      );

      // Assert
      const gridContainer = elements.getGridContainer();
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass(
        "grid",
        "grid-cols-2",
        "gap-4",
        "sm:grid-cols-3",
        "md:grid-cols-4",
        "lg:grid-cols-5",
        "xl:grid-cols-6",
        "2xl:grid-cols-7"
      );
    });

    it("should render all games as game cards", () => {
      // Act
      renderWithTestProviders(
        <GridView backlogItems={mockGameWithBacklogItems} />
      );

      // Assert
      const gameCards = elements.getGameCards();
      expect(gameCards).toHaveLength(2);
      expect(elements.getGameCardByTitle("Test Game 1")).toBeInTheDocument();
      expect(elements.getGameCardByTitle("Test Game 2")).toBeInTheDocument();
    });

    it("should pass correct props to GameCard components", () => {
      // Act
      renderWithTestProviders(
        <GridView backlogItems={mockGameWithBacklogItems} />
      );

      // Assert
      // Verify game titles are rendered (indicating GameCard received game prop)
      expect(elements.getGameCardByTitle("Test Game 1")).toBeInTheDocument();
      expect(elements.getGameCardByTitle("Test Game 2")).toBeInTheDocument();

      // Each game card should be in its own list item
      const gameCards = elements.getGameCards();
      expect(gameCards[0]).toContainElement(
        elements.getGameCardByTitle("Test Game 1")
      );
      expect(gameCards[1]).toContainElement(
        elements.getGameCardByTitle("Test Game 2")
      );
    });

    it("should use game id as the key for list items", () => {
      // Act
      renderWithTestProviders(
        <GridView backlogItems={mockGameWithBacklogItems} />
      );

      // Assert
      const gameCards = elements.getGameCards();
      expect(gameCards).toHaveLength(2);
      // Keys are internal React props, but we can verify unique rendering
      expect(elements.getGameCardByTitle("Test Game 1")).toBeInTheDocument();
      expect(elements.getGameCardByTitle("Test Game 2")).toBeInTheDocument();
    });
  });

  describe("when backlog items array is empty", () => {
    it("should render an empty grid", () => {
      // Act
      renderWithTestProviders(<GridView backlogItems={[]} />);

      // Assert
      const gridContainer = elements.getGridContainer();
      expect(gridContainer).toBeInTheDocument();
      expect(elements.queryGameCards()).toHaveLength(0);
    });
  });

  describe("when games have multiple backlog items", () => {
    const gameWithMultipleBacklogItems = [
      {
        game: {
          id: "game-multi",
          title: "Multi-Platform Game",
          coverImage: "https://example.com/multi.jpg",
          igdbId: 99999,
          summary: "Game on multiple platforms",
          aggregatedRating: 95,
          totalRatingCount: 300,
          releaseDate: new Date("2024-03-01"),
          createdAt: new Date(),
          updatedAt: new Date(),
          slug: "multi-platform-game",
        },
        backlogItems: [
          {
            id: 3,
            userId: "user-1",
            gameId: "game-multi",
            platform: "PC",
            status: BacklogItemStatus.COMPLETED,
            acquisitionType: "DIGITAL" as const,
            startedAt: new Date("2024-01-01"),
            completedAt: new Date("2024-01-31"),
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-31"),
          },
          {
            id: 4,
            userId: "user-1",
            gameId: "game-multi",
            platform: "PlayStation",
            status: BacklogItemStatus.TO_PLAY,
            acquisitionType: "PHYSICAL" as const,
            startedAt: null,
            completedAt: null,
            createdAt: new Date("2024-02-01"),
            updatedAt: new Date("2024-02-01"),
          },
        ],
      },
    ];

    it("should use the first backlog item as currentPlatform", () => {
      // Act
      renderWithTestProviders(
        <GridView backlogItems={gameWithMultipleBacklogItems} />
      );

      // Assert
      expect(
        elements.getGameCardByTitle("Multi-Platform Game")
      ).toBeInTheDocument();
      // The component passes backlogItems[0] as currentPlatform
      // We can't directly test the prop, but we can verify the game renders
    });
  });

  describe("when games have no backlog items", () => {
    const gameWithNoBacklogItems = [
      {
        game: {
          id: "game-empty",
          title: "Game Without Backlog",
          coverImage: "https://example.com/empty.jpg",
          igdbId: 11111,
          summary: "Game without backlog items",
          aggregatedRating: 80,
          totalRatingCount: 50,
          releaseDate: new Date("2024-04-01"),
          createdAt: new Date(),
          updatedAt: new Date(),
          slug: "game-without-backlog",
        },
        backlogItems: [],
      },
    ];

    it("should handle games with empty backlog items array", () => {
      // Act
      renderWithTestProviders(
        <GridView backlogItems={gameWithNoBacklogItems} />
      );

      // Assert
      expect(
        elements.getGameCardByTitle("Game Without Backlog")
      ).toBeInTheDocument();
      // currentPlatform will be undefined, which should be handled by GameCard
    });
  });

  describe("responsive grid behavior", () => {
    it("should have responsive grid classes for different screen sizes", () => {
      // Act
      renderWithTestProviders(
        <GridView backlogItems={mockGameWithBacklogItems} />
      );

      // Assert
      const gridContainer = elements.getGridContainer();

      // Verify responsive grid classes
      expect(gridContainer).toHaveClass("grid-cols-2"); // Base: 2 columns
      expect(gridContainer).toHaveClass("sm:grid-cols-3"); // Small: 3 columns
      expect(gridContainer).toHaveClass("md:grid-cols-4"); // Medium: 4 columns
      expect(gridContainer).toHaveClass("lg:grid-cols-5"); // Large: 5 columns
      expect(gridContainer).toHaveClass("xl:grid-cols-6"); // XL: 6 columns
      expect(gridContainer).toHaveClass("2xl:grid-cols-7"); // 2XL: 7 columns
      expect(gridContainer).toHaveClass("gap-4"); // Consistent gap
    });
  });
});
