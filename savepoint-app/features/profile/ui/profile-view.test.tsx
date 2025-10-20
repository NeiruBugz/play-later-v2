import type { ProfileWithStats } from "@/data-access-layer/services";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileView } from "./profile-view";

const createMockProfile = (
  overrides?: Partial<ProfileWithStats>
): ProfileWithStats => ({
  username: "testuser",
  name: "Test User",
  email: "test@example.com",
  image: "https://example.com/avatar.jpg",
  createdAt: new Date("2024-01-15T00:00:00.000Z"),
  stats: {
    statusCounts: {
      CURIOUS_ABOUT: 5,
      CURRENTLY_EXPLORING: 3,
      EXPERIENCED: 10,
    },
    recentGames: [
      {
        gameId: "1",
        title: "The Legend of Zelda",
        coverImage: "https://example.com/zelda.jpg",
        lastPlayed: new Date("2025-01-15T12:00:00.000Z"),
      },
      {
        gameId: "2",
        title: "Super Mario Bros",
        coverImage: "https://example.com/mario.jpg",
        lastPlayed: new Date("2025-01-10T12:00:00.000Z"),
      },
    ],
  },
  ...overrides,
});

const elements = {
  getHeading: (name: string) => screen.getByRole("heading", { name, level: 2 }),
  queryHeading: (name: string) =>
    screen.queryByRole("heading", { name, level: 1 }),
  getLibraryStatsHeading: () =>
    screen.getByRole("heading", { name: "Library Stats", level: 2 }),
  queryLibraryStatsHeading: () =>
    screen.queryByRole("heading", { name: "Library Stats", level: 2 }),
  getRecentlyPlayedHeading: () =>
    screen.getByRole("heading", { name: "Recently Played", level: 2 }),
  queryRecentlyPlayedHeading: () =>
    screen.queryByRole("heading", { name: "Recently Played", level: 2 }),
  getAvatar: (name: string) => screen.getByAltText(`${name}'s avatar`),
  queryAvatar: (name: string) => screen.queryByAltText(`${name}'s avatar`),
  getEmptyLibraryMessage: () => screen.getByText(/Your library is empty/i),
  queryEmptyLibraryMessage: () => screen.queryByText(/Your library is empty/i),
  getGameByTitle: (title: string) => screen.getByText(title),
  queryGameByTitle: (title: string) => screen.queryByText(title),
  getEmail: (email: string) => screen.getByText(email),
  queryEmail: (email: string) => screen.queryByText(email),
  getJoinDate: () => screen.getByText(/Joined/i),
  getStatusLabel: (label: string) => screen.getByText(label),
  queryStatusLabel: (label: string) => screen.queryByText(label),
  getStatusCount: (count: string) => screen.getByText(count),
  getInitialFallback: (initial: string) => screen.getByText(initial),
  getRelativeTime: (text: string) => screen.getByText(text),
};

describe("ProfileView", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-20T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("given profile with username", () => {
    it("should display username as heading", () => {
      const profile = createMockProfile({ username: "cooluser123" });
      render(<ProfileView profile={profile} />);

      expect(elements.getHeading("cooluser123")).toBeVisible();
    });
  });

  describe("given profile without username", () => {
    it("should display name when username is null", () => {
      const profile = createMockProfile({
        username: null,
        name: "John Doe",
      });
      render(<ProfileView profile={profile} />);

      expect(elements.getHeading("John Doe")).toBeVisible();
    });

    it("should display email when username and name are null", () => {
      const profile = createMockProfile({
        username: null,
        name: null,
        email: "fallback@example.com",
      });
      render(<ProfileView profile={profile} />);

      expect(elements.getHeading("fallback@example.com")).toBeVisible();
    });

    it("should display 'User' when all identity fields are null", () => {
      const profile = createMockProfile({
        username: null,
        name: null,
        email: null,
      });
      render(<ProfileView profile={profile} />);

      expect(elements.getHeading("User")).toBeVisible();
    });
  });

  describe("given profile with avatar image", () => {
    it("should render avatar image", () => {
      const profile = createMockProfile({
        username: "testuser",
        image: "https://example.com/avatar.jpg",
      });
      render(<ProfileView profile={profile} />);

      const avatar = elements.getAvatar("testuser");
      expect(avatar).toBeVisible();
      expect(avatar).toHaveAttribute(
        "src",
        expect.stringContaining("avatar.jpg")
      );
    });
  });

  describe("given profile without avatar image", () => {
    it("should render initial from username", () => {
      const profile = createMockProfile({
        username: "testuser",
        image: null,
      });
      render(<ProfileView profile={profile} />);

      expect(elements.queryAvatar("testuser")).not.toBeInTheDocument();
      expect(elements.getInitialFallback("T")).toBeVisible();
    });

    it("should render initial from name when username is null", () => {
      const profile = createMockProfile({
        username: null,
        name: "Alice",
        image: null,
      });
      render(<ProfileView profile={profile} />);

      expect(elements.getInitialFallback("A")).toBeVisible();
    });
  });

  describe("given profile with email", () => {
    it("should display email address", () => {
      const profile = createMockProfile({ email: "user@example.com" });
      render(<ProfileView profile={profile} />);

      expect(elements.getEmail("user@example.com")).toBeVisible();
    });
  });

  describe("given profile without email", () => {
    it("should not display email section", () => {
      const profile = createMockProfile({ email: null });
      render(<ProfileView profile={profile} />);

      expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    });
  });

  describe("given profile with creation date", () => {
    it("should display formatted join date", () => {
      const profile = createMockProfile({
        createdAt: new Date("2024-01-15T00:00:00.000Z"),
      });
      render(<ProfileView profile={profile} />);

      expect(elements.getJoinDate()).toHaveTextContent("Joined January 2024");
    });

    it("should handle different date formats correctly", () => {
      const profile = createMockProfile({
        createdAt: new Date("2023-12-01T00:00:00.000Z"),
      });
      render(<ProfileView profile={profile} />);

      expect(elements.getJoinDate()).toHaveTextContent("Joined December 2023");
    });
  });

  describe("given profile with library stats", () => {
    beforeEach(() => {
      const profile = createMockProfile({
        stats: {
          statusCounts: {
            CURIOUS_ABOUT: 5,
            CURRENTLY_EXPLORING: 3,
            EXPERIENCED: 10,
          },
          recentGames: [],
        },
      });
      render(<ProfileView profile={profile} />);
    });

    it("should display library stats heading", () => {
      expect(elements.getLibraryStatsHeading()).toBeVisible();
    });

    it("should display all status labels with counts", () => {
      expect(elements.getStatusLabel("Curious About")).toBeVisible();
      expect(elements.getStatusCount("5")).toBeVisible();
      expect(elements.getStatusLabel("Currently Exploring")).toBeVisible();
      expect(elements.getStatusCount("3")).toBeVisible();
      expect(elements.getStatusLabel("Experienced")).toBeVisible();
      expect(elements.getStatusCount("10")).toBeVisible();
    });
  });

  describe("given profile with zero status counts", () => {
    it("should filter out statuses with zero counts", () => {
      const profile = createMockProfile({
        stats: {
          statusCounts: {
            CURIOUS_ABOUT: 5,
            CURRENTLY_EXPLORING: 0,
            EXPERIENCED: 10,
          },
          recentGames: [],
        },
      });
      render(<ProfileView profile={profile} />);

      expect(elements.getStatusLabel("Curious About")).toBeVisible();
      expect(elements.getStatusLabel("Experienced")).toBeVisible();
      expect(
        elements.queryStatusLabel("Currently Exploring")
      ).not.toBeInTheDocument();
    });

    it("should not display library stats section when all counts are zero", () => {
      const profile = createMockProfile({
        stats: {
          statusCounts: {
            CURIOUS_ABOUT: 0,
            CURRENTLY_EXPLORING: 0,
            EXPERIENCED: 0,
          },
          recentGames: [],
        },
      });
      render(<ProfileView profile={profile} />);

      expect(elements.queryLibraryStatsHeading()).not.toBeInTheDocument();
    });
  });

  describe("given profile with unknown status type", () => {
    it("should display raw status key for unmapped statuses", () => {
      const profile = createMockProfile({
        stats: {
          statusCounts: {
            UNKNOWN_STATUS: 7,
          },
          recentGames: [],
        },
      });
      render(<ProfileView profile={profile} />);

      expect(elements.getStatusLabel("UNKNOWN_STATUS")).toBeVisible();
      expect(elements.getStatusCount("7")).toBeVisible();
    });
  });

  describe("given profile with recent games", () => {
    beforeEach(() => {
      const profile = createMockProfile();
      render(<ProfileView profile={profile} />);
    });

    it("should display recently played heading", () => {
      expect(elements.getRecentlyPlayedHeading()).toBeVisible();
    });

    it("should display all recent game titles", () => {
      expect(elements.getGameByTitle("The Legend of Zelda")).toBeVisible();
      expect(elements.getGameByTitle("Super Mario Bros")).toBeVisible();
    });

    it("should display game cover images", () => {
      const zeldaCover = screen.getByAltText("The Legend of Zelda");
      expect(zeldaCover).toBeVisible();
      expect(zeldaCover).toHaveAttribute(
        "src",
        expect.stringContaining("zelda.jpg")
      );

      const marioCover = screen.getByAltText("Super Mario Bros");
      expect(marioCover).toBeVisible();
      expect(marioCover).toHaveAttribute(
        "src",
        expect.stringContaining("mario.jpg")
      );
    });

    it("should display relative time for last played", () => {
      expect(elements.getRelativeTime("5 days ago")).toBeVisible();
      expect(elements.getRelativeTime("10 days ago")).toBeVisible();
    });
  });

  describe("given profile with game without cover image", () => {
    it("should display placeholder for missing cover", () => {
      const profile = createMockProfile({
        stats: {
          statusCounts: {},
          recentGames: [
            {
              gameId: "1",
              title: "Game Without Cover",
              coverImage: null,
              lastPlayed: new Date("2025-01-15T12:00:00.000Z"),
            },
          ],
        },
      });
      render(<ProfileView profile={profile} />);

      expect(elements.getGameByTitle("Game Without Cover")).toBeVisible();
      expect(
        screen.queryByAltText("Game Without Cover")
      ).not.toBeInTheDocument();
    });
  });

  describe("given profile without recent games", () => {
    it("should not display recently played section", () => {
      const profile = createMockProfile({
        stats: {
          statusCounts: { EXPERIENCED: 5 },
          recentGames: [],
        },
      });
      render(<ProfileView profile={profile} />);

      expect(elements.queryRecentlyPlayedHeading()).not.toBeInTheDocument();
    });
  });

  describe("given profile with empty library", () => {
    beforeEach(() => {
      const profile = createMockProfile({
        stats: {
          statusCounts: {},
          recentGames: [],
        },
      });
      render(<ProfileView profile={profile} />);
    });

    it("should display empty state message", () => {
      expect(elements.getEmptyLibraryMessage()).toBeVisible();
    });

    it("should not display library stats section", () => {
      expect(elements.queryLibraryStatsHeading()).not.toBeInTheDocument();
    });

    it("should not display recently played section", () => {
      expect(elements.queryRecentlyPlayedHeading()).not.toBeInTheDocument();
    });
  });

  describe("given profile with stats but no recent games", () => {
    it("should not display empty state", () => {
      const profile = createMockProfile({
        stats: {
          statusCounts: { EXPERIENCED: 5 },
          recentGames: [],
        },
      });
      render(<ProfileView profile={profile} />);

      expect(elements.queryEmptyLibraryMessage()).not.toBeInTheDocument();
    });
  });

  describe("given profile with recent games but no stats", () => {
    it("should not display empty state", () => {
      const profile = createMockProfile({
        stats: {
          statusCounts: {},
          recentGames: [
            {
              gameId: "1",
              title: "Recent Game",
              coverImage: null,
              lastPlayed: new Date("2025-01-15T12:00:00.000Z"),
            },
          ],
        },
      });
      render(<ProfileView profile={profile} />);

      expect(elements.queryEmptyLibraryMessage()).not.toBeInTheDocument();
    });
  });

  describe("given complete profile with all data", () => {
    beforeEach(() => {
      const profile = createMockProfile();
      render(<ProfileView profile={profile} />);
    });

    it("should display user header section", () => {
      expect(elements.getHeading("testuser")).toBeVisible();
      expect(elements.getEmail("test@example.com")).toBeVisible();
      expect(elements.getJoinDate()).toHaveTextContent("Joined January 2024");
      expect(elements.getAvatar("testuser")).toBeVisible();
    });

    it("should display library stats section", () => {
      expect(elements.getLibraryStatsHeading()).toBeVisible();
      expect(elements.getStatusLabel("Curious About")).toBeVisible();
      expect(elements.getStatusCount("5")).toBeVisible();
    });

    it("should display recently played section", () => {
      expect(elements.getRecentlyPlayedHeading()).toBeVisible();
      expect(elements.getGameByTitle("The Legend of Zelda")).toBeVisible();
      expect(elements.getGameByTitle("Super Mario Bros")).toBeVisible();
    });

    it("should not display empty state", () => {
      expect(elements.queryEmptyLibraryMessage()).not.toBeInTheDocument();
    });
  });
});
