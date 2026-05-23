import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { LibraryStats } from "@/entities/library-item/api/get-library-stats.server";
import type { Profile } from "@/entities/profile/model/types";

import { ProfileOverview } from "./profile-overview";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...rest
  }: {
    children: React.ReactNode;
    to: string;
  } & React.HTMLAttributes<HTMLAnchorElement>) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/upload-avatar", () => ({
  AvatarUpload: ({ label }: { label?: string }) => (
    <div data-testid="avatar-upload-mock">{label ?? "Upload avatar"}</div>
  ),
}));

const stubProfile: Profile = {
  id: "user-stub-1",
  name: "Stub User",
  username: "stubuser",
  image: null,
  isPublicProfile: true,
};

const stubStats: LibraryStats = {
  statusCounts: {
    BACKLOG: 1,
    IN_PROGRESS: 0,
    COMPLETED: 2,
    ABANDONED: 0,
    FULL_COMPLETION: 0,
    PLAYING: 1,
  } as never,
  recentGames: [
    {
      gameId: "game-1",
      title: "Balatro",
      coverImage: "/covers/balatro.jpg",
      lastPlayed: new Date("2026-05-07T12:00:00.000Z"),
    },
  ],
  journalCount: 3,
} as unknown as LibraryStats;

const elements = {
  getEditProfileLink: () => screen.getByRole("link", { name: "Edit Profile" }),
  queryEditProfileLink: () =>
    screen.queryByRole("link", { name: "Edit Profile" }),
  getOverviewTab: () => screen.getByRole("tab", { name: "Overview" }),
  getLibraryTab: () => screen.getByRole("tab", { name: "Library" }),
  getActivityTab: () => screen.getByRole("tab", { name: "Activity" }),
  queryRecentlyPlayed: () => screen.queryByTestId("overview-recently-played"),
  queryLibraryEmpty: () => screen.queryByTestId("profile-library-empty"),
  queryLibrarySlot: () => screen.queryByTestId("profile-library-slot"),
  queryActivityEmpty: () => screen.queryByTestId("profile-activity-empty"),
  getHeroBanner: () => screen.getByTestId("profile-hero-banner"),
  getStatsBar: () => screen.getByTestId("profile-stats-bar"),
};

const actions = {
  clickLibraryTab: () => userEvent.click(elements.getLibraryTab()),
  clickActivityTab: () => userEvent.click(elements.getActivityTab()),
};

describe("ProfileOverview", () => {
  describe("given isOwnProfile is true", () => {
    it("renders the change-avatar overlay trigger", () => {
      render(
        <ProfileOverview profile={stubProfile} stats={stubStats} isOwnProfile />
      );
      expect(screen.getByText("Change avatar")).toBeDefined();
    });

    it("renders the Edit Profile button linking to /settings/profile", () => {
      render(
        <ProfileOverview profile={stubProfile} stats={stubStats} isOwnProfile />
      );
      expect(elements.getEditProfileLink()).toHaveAttribute(
        "href",
        "/settings/profile"
      );
    });
  });

  describe("given isOwnProfile is false (public viewer)", () => {
    it("does not render the change-avatar overlay trigger", () => {
      render(
        <ProfileOverview
          profile={stubProfile}
          stats={stubStats}
          isOwnProfile={false}
        />
      );
      expect(screen.queryByText("Change avatar")).toBeNull();
    });

    it("does not render the Edit Profile button", () => {
      render(
        <ProfileOverview
          profile={stubProfile}
          stats={stubStats}
          isOwnProfile={false}
        />
      );
      expect(elements.queryEditProfileLink()).toBeNull();
    });
  });

  describe("given any viewer (default tab)", () => {
    it("defaults to the Overview tab showing Recently Played", () => {
      render(<ProfileOverview profile={stubProfile} stats={stubStats} />);
      expect(elements.queryRecentlyPlayed()).not.toBeNull();
    });

    it("renders the hero banner with a gradient background", () => {
      render(<ProfileOverview profile={stubProfile} stats={stubStats} />);
      const style = elements.getHeroBanner().getAttribute("style") ?? "";
      expect(style).toContain("linear-gradient");
    });

    it("renders four stat cards on the overview tab", () => {
      render(<ProfileOverview profile={stubProfile} stats={stubStats} />);
      expect(screen.getAllByTestId("profile-stats-bar-item").length).toBe(4);
    });
  });

  describe("given the Library tab is selected without a library slot", () => {
    it("renders the library empty-state placeholder", async () => {
      render(<ProfileOverview profile={stubProfile} stats={stubStats} />);
      await actions.clickLibraryTab();
      expect(elements.queryLibraryEmpty()).not.toBeNull();
    });
  });

  describe("given the Library tab is selected with a library slot", () => {
    beforeEach(async () => {
      render(
        <ProfileOverview
          profile={stubProfile}
          stats={stubStats}
          librarySlot={<div data-testid="profile-library-slot">Library</div>}
        />
      );
      await actions.clickLibraryTab();
    });

    it("renders the provided library content", () => {
      expect(elements.queryLibrarySlot()).not.toBeNull();
    });

    it("does not render the empty-state placeholder", () => {
      expect(elements.queryLibraryEmpty()).toBeNull();
    });
  });

  describe("given the Activity tab is selected", () => {
    it("renders the activity empty-state placeholder", async () => {
      render(<ProfileOverview profile={stubProfile} stats={stubStats} />);
      await actions.clickActivityTab();
      expect(elements.queryActivityEmpty()).not.toBeNull();
    });
  });
});
