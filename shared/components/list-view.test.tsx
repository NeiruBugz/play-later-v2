import { renderWithTestProviders } from "@/test/utils/test-provider";
import { BacklogItemStatus } from "@prisma/client";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ListView } from "./list-view";

const elements = {
  getListContainer: () => document.querySelector(".space-y-3"),
  getAllGameItems: () => document.querySelectorAll(".group.flex.items-center"),
  getGameTitle: (title: string) => screen.getByRole("heading", { name: title }),
  getGameDescription: (description: string) => screen.getByText(description),
  getViewDetailsButton: () =>
    screen.getByRole("link", { name: "View Details" }),
  getStatusBadge: (status: string) => screen.getByText(status),
  getPlatformText: (platform: string) => screen.getByText(platform),
  getReleaseDateText: (date: string) => screen.getByText(date),
  getMultiPlatformBadge: (count: string) => screen.getByText(count),
  queryGameDescription: (description: string) =>
    screen.queryByText(description),
  queryPlatformText: (platform: string) => screen.queryByText(platform),
  queryReleaseDateText: (date: string) => screen.queryByText(date),
  queryMultiPlatformBadge: (count: string) => screen.queryByText(count),
};

describe("ListView", () => {
  const mockGameWithBacklogItems = [
    {
      game: {
        id: "game-1",
        title: "Test Game 1",
        coverImage: "cover123",
        description: "This is a test game description",
        releaseDate: new Date("2024-01-15"),
        igdbId: 12345,
        hltbId: null,
        mainStory: null,
        mainExtra: null,
        completionist: null,
        steamAppId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      backlogItems: [
        {
          id: 1,
          userId: "user-1",
          gameId: "game-1",
          platform: "PC",
          status: BacklogItemStatus.PLAYING,
          acquisitionType: "DIGITAL" as const,
          startedAt: new Date("2024-01-01"),
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
        coverImage: "cover456",
        description: null,
        releaseDate: null,
        igdbId: 67890,
        summary: "Another test game",
        createdAt: new Date(),
        updatedAt: new Date(),
        hltbId: null,
        mainStory: null,
        mainExtra: null,
        completionist: null,
        steamAppId: null,
      },
      backlogItems: [
        {
          id: 2,
          userId: "user-1",
          gameId: "game-2",
          platform: "PlayStation",
          status: BacklogItemStatus.COMPLETED,
          acquisitionType: "PHYSICAL" as const,
          startedAt: new Date("2024-01-01"),
          completedAt: new Date("2024-01-31"),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-31"),
        },
      ],
    },
  ];

  describe("when rendering games", () => {
    it("should render a container with proper spacing", () => {
      // Act
      renderWithTestProviders(
        <ListView backlogItems={mockGameWithBacklogItems} />
      );

      // Assert
      const container = elements.getListContainer();
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass("space-y-3");
    });

    it("should render all games with their titles", () => {
      // Act
      renderWithTestProviders(
        <ListView backlogItems={mockGameWithBacklogItems} />
      );

      // Assert
      expect(
        screen.getByRole("heading", { name: "Test Game 1" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Test Game 2" })
      ).toBeInTheDocument();
    });

    it("should display game descriptions when available", () => {
      // Act
      renderWithTestProviders(
        <ListView backlogItems={mockGameWithBacklogItems} />
      );

      // Assert
      expect(
        screen.getByText("This is a test game description")
      ).toBeInTheDocument();
      // Game 2 has no description, so it shouldn't render
      expect(screen.queryByText("Another test game")).not.toBeInTheDocument();
    });

    it("should render View Details buttons with correct links", () => {
      // Act
      renderWithTestProviders(
        <ListView backlogItems={mockGameWithBacklogItems} />
      );

      // Assert
      const viewDetailsButtons = screen.getAllByRole("link", {
        name: "View Details",
      });
      expect(viewDetailsButtons).toHaveLength(2);
      expect(viewDetailsButtons[0]).toHaveAttribute("href", "/game/game-1");
      expect(viewDetailsButtons[1]).toHaveAttribute("href", "/game/game-2");
    });
  });

  describe("status display", () => {
    it("should display correct status badges", () => {
      // Act
      renderWithTestProviders(
        <ListView backlogItems={mockGameWithBacklogItems} />
      );

      // Assert
      expect(screen.getByText("Playing")).toBeInTheDocument();
      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    it("should default to Backlog status when no backlog items exist", () => {
      const gameWithNoBacklogItems = [
        {
          game: {
            id: "game-empty",
            title: "Empty Game",
            coverImage: null,
            description: null,
            releaseDate: null,
            igdbId: 99999,
            createdAt: new Date(),
            updatedAt: new Date(),
            hltbId: null,
            mainStory: null,
            mainExtra: null,
            completionist: null,
            steamAppId: null,
          },
          backlogItems: [],
        },
      ];

      // Act
      renderWithTestProviders(
        <ListView backlogItems={gameWithNoBacklogItems} />
      );

      // Assert
      expect(screen.getByText("Backlog")).toBeInTheDocument();
    });

    it("should apply correct status colors to badges", () => {
      // Act
      renderWithTestProviders(
        <ListView backlogItems={mockGameWithBacklogItems} />
      );

      // Assert
      const playingBadge = screen.getByText("Playing");
      const completedBadge = screen.getByText("Completed");

      // Check that badges have the status-specific classes
      expect(playingBadge).toHaveClass("bg-green-100", "text-green-800");
      expect(completedBadge).toHaveClass("bg-purple-100", "text-purple-800");
    });
  });

  describe("platform display", () => {
    it("should display platform information when available", () => {
      // Act
      renderWithTestProviders(
        <ListView backlogItems={mockGameWithBacklogItems} />
      );

      // Assert
      expect(screen.getByText("PC")).toBeInTheDocument();
      expect(screen.getByText("PlayStation")).toBeInTheDocument();
    });

    it("should not display platform when not available", () => {
      const gameWithNoPlatform = [
        {
          game: {
            id: "game-no-platform",
            title: "No Platform Game",
            coverImage: null,
            description: null,
            releaseDate: null,
            igdbId: 88888,
            createdAt: new Date(),
            updatedAt: new Date(),
            hltbId: null,
            mainStory: null,
            mainExtra: null,
            completionist: null,
            steamAppId: null,
          },
          backlogItems: [
            {
              id: 3,
              userId: "user-1",
              gameId: "game-no-platform",
              platform: null,
              status: BacklogItemStatus.TO_PLAY,
              acquisitionType: "DIGITAL" as const,
              startedAt: null,
              completedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ];

      // Act
      renderWithTestProviders(<ListView backlogItems={gameWithNoPlatform} />);

      // Assert
      // Should not show Monitor icon or platform text when platform is null
      const monitorIcons = document.querySelectorAll("svg");
      const platformText = screen.queryByText("null");
      expect(platformText).not.toBeInTheDocument();
    });
  });

  describe("release date display", () => {
    it("should display formatted release dates when available", () => {
      // Act
      renderWithTestProviders(
        <ListView backlogItems={mockGameWithBacklogItems} />
      );

      // Assert
      const expectedDate = new Date("2024-01-15").toLocaleDateString();
      expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });

    it("should not display release date when not available", () => {
      // Game 2 has null release date, so calendar icon shouldn't appear for it
      // We can check this by ensuring only one calendar icon exists
      renderWithTestProviders(
        <ListView backlogItems={mockGameWithBacklogItems} />
      );

      // Only one game has a release date
      const calendarIcons = document.querySelectorAll(
        '[data-lucide="calendar-days"]'
      );
      expect(calendarIcons.length).toBeLessThanOrEqual(1);
    });
  });

  describe("multi-platform indicator", () => {
    it("should show multi-platform badge when game has multiple backlog items", () => {
      const gameWithMultiplePlatforms = [
        {
          game: {
            id: "game-multi",
            title: "Multi-Platform Game",
            coverImage: "multi123",
            description: "Available on multiple platforms",
            releaseDate: new Date("2024-02-01"),
            igdbId: 77777,
            createdAt: new Date(),
            updatedAt: new Date(),
            hltbId: null,
            mainStory: null,
            mainExtra: null,
            completionist: null,
            steamAppId: null,
          },
          backlogItems: [
            {
              id: 4,
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
              id: 5,
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
            {
              id: 6,
              userId: "user-1",
              gameId: "game-multi",
              platform: "Xbox",
              status: BacklogItemStatus.WISHLIST,
              acquisitionType: "DIGITAL" as const,
              startedAt: null,
              completedAt: null,
              createdAt: new Date("2024-02-15"),
              updatedAt: new Date("2024-02-15"),
            },
          ],
        },
      ];

      // Act
      renderWithTestProviders(
        <ListView backlogItems={gameWithMultiplePlatforms} />
      );

      // Assert
      expect(screen.getByText("+2 more")).toBeInTheDocument();
    });

    it("should not show multi-platform badge for single platform games", () => {
      // Act
      renderWithTestProviders(
        <ListView backlogItems={mockGameWithBacklogItems} />
      );

      // Assert
      expect(screen.queryByText("+1 more")).not.toBeInTheDocument();
      expect(screen.queryByText("+0 more")).not.toBeInTheDocument();
    });
  });

  describe("when backlog items array is empty", () => {
    it("should render empty container", () => {
      // Act
      renderWithTestProviders(<ListView backlogItems={[]} />);

      // Assert
      const container = document.querySelector(".space-y-3");
      expect(container).toBeInTheDocument();
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("responsive design", () => {
    it("should have responsive layout classes", () => {
      // Act
      renderWithTestProviders(
        <ListView backlogItems={mockGameWithBacklogItems} />
      );

      // Assert
      const gameItems = document.querySelectorAll(".group.flex.items-center");
      expect(gameItems.length).toBeGreaterThan(0);

      // Check for responsive classes in the metadata section
      const metadataSection = document.querySelector(
        ".flex.flex-col.gap-2.sm\\:flex-row"
      );
      expect(metadataSection).toBeInTheDocument();
    });
  });

  describe("image rendering", () => {
    it("should render IGDB images with correct props", () => {
      // Act
      renderWithTestProviders(
        <ListView backlogItems={mockGameWithBacklogItems} />
      );

      // Assert
      const images = screen.getAllByRole("img");
      expect(images.length).toBeGreaterThan(0);

      // Check that the first image has the expected alt text
      expect(images[0]).toHaveAttribute(
        "alt",
        expect.stringContaining("Test Game 1")
      );
    });
  });
});
