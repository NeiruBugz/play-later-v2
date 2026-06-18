import { render, screen, within } from "@testing-library/react";
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
    SHELF: 3,
    PLAYING: 1,
    // PLAYED includes dropped + finished games; deliberately larger than the
    // real completion count so the two stats are observably distinct.
    PLAYED: 5,
  },
  // Real completions (`completedAt IS NOT NULL`) — fewer than PLAYED.
  completedCount: 2,
  recentGames: [
    {
      gameId: "game-1",
      title: "Balatro",
      coverImage: "/covers/balatro.jpg",
      lastPlayed: new Date("2026-05-07T12:00:00.000Z"),
    },
  ],
  journalCount: 3,
};

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
  queryPlaythroughsSection: () => screen.queryByTestId("overview-playthroughs"),
  queryPlaythroughsSlot: () =>
    screen.queryByTestId("profile-playthroughs-slot"),
  getHeroBanner: () => screen.getByTestId("profile-hero-banner"),
  getStatRow: () => screen.getByTestId("profile-stat-row"),
  getPrimaryAction: () => screen.getByTestId("profile-primary-action"),
  queryPrimaryAction: () => screen.queryByTestId("profile-primary-action"),
  getTabStrip: () => screen.getByTestId("profile-tab-strip"),
  getIdentityBlock: () => screen.getByTestId("profile-identity-block"),
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
      // Renders once for mobile (full-width) and once for desktop — both point to the same route.
      const links = screen.getAllByRole("link", { name: "Edit Profile" });
      expect(links.length).toBeGreaterThan(0);
      for (const link of links) {
        expect(link).toHaveAttribute("href", "/settings/profile");
      }
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

    it("renders four inline stat items in the compact header stat row", () => {
      render(<ProfileOverview profile={stubProfile} stats={stubStats} />);
      expect(screen.getAllByTestId("profile-stat-item").length).toBe(4);
    });

    it("shows played and completed as distinct stat items (no phantom COMPLETED fallback)", () => {
      render(<ProfileOverview profile={stubProfile} stats={stubStats} />);
      const items = screen.getAllByTestId("profile-stat-item");
      const playedItem = items.find(
        (item) => within(item).queryByText("played") !== null
      );
      const completedItem = items.find(
        (item) => within(item).queryByText("completed") !== null
      );
      // PLAYED status count (5) and real completions (2) are different numbers
      // rendered in their own stat items — proving the two metrics aren't conflated.
      expect(playedItem).toBeDefined();
      expect(completedItem).toBeDefined();
      expect(within(playedItem!).getByText("5")).toBeInTheDocument();
      expect(within(completedItem!).getByText("2")).toBeInTheDocument();
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

  describe("given no playthroughsSlot is supplied", () => {
    it("does not render the Playthroughs section", () => {
      render(<ProfileOverview profile={stubProfile} stats={stubStats} />);
      expect(elements.queryPlaythroughsSection()).toBeNull();
    });
  });

  describe("given a playthroughsSlot is supplied", () => {
    beforeEach(() => {
      render(
        <ProfileOverview
          profile={stubProfile}
          stats={stubStats}
          playthroughsSlot={
            <div data-testid="profile-playthroughs-slot">Playthroughs</div>
          }
        />
      );
    });

    it("renders the Playthroughs section wrapper on the overview tab", () => {
      expect(elements.queryPlaythroughsSection()).not.toBeNull();
    });

    it("renders the injected slot content inside the section", () => {
      expect(elements.queryPlaythroughsSlot()).not.toBeNull();
    });
  });

  // AC PRO-1: compact header — content starts high with a sticky tab strip
  describe("given any viewer (AC PRO-1 compact header)", () => {
    beforeEach(() => {
      render(<ProfileOverview profile={stubProfile} stats={stubStats} />);
    });

    it("renders a compact horizontal stat row inside the identity block", () => {
      expect(elements.getStatRow()).toBeDefined();
    });

    it("stat row contains exactly 4 inline stat items (in library / played / completed / entries)", () => {
      const row = elements.getStatRow();
      const items = within(row).getAllByTestId("profile-stat-item");
      expect(items.length).toBe(4);
    });

    it("stat row is inside the identity block", () => {
      const identityBlock = elements.getIdentityBlock();
      const row = within(identityBlock).getByTestId("profile-stat-row");
      expect(row).toBeDefined();
    });

    it("renders the sticky tab strip with a sticky position class", () => {
      const tabStrip = elements.getTabStrip();
      expect(tabStrip.className).toContain("sticky");
    });

    it("tab strip contains the Overview, Library and Activity tabs", () => {
      const tabStrip = elements.getTabStrip();
      expect(
        within(tabStrip).getByRole("tab", { name: "Overview" })
      ).toBeDefined();
      expect(
        within(tabStrip).getByRole("tab", { name: "Library" })
      ).toBeDefined();
      expect(
        within(tabStrip).getByRole("tab", { name: "Activity" })
      ).toBeDefined();
    });
  });

  // AC PRO-2: primary action is full-width and below the identity block (not squeezed into the name row)
  describe("given isOwnProfile is true (AC PRO-2 full-width primary action)", () => {
    beforeEach(() => {
      render(
        <ProfileOverview profile={stubProfile} stats={stubStats} isOwnProfile />
      );
    });

    it("renders the primary action with data-testid profile-primary-action", () => {
      expect(elements.getPrimaryAction()).toBeDefined();
    });

    it("primary action has a full-width class (w-full)", () => {
      expect(elements.getPrimaryAction().className).toContain("w-full");
    });

    it("primary action is NOT an ancestor of the h1 heading — action comes after name, not around it", () => {
      // AC PRO-2: the action must not wrap or contain the name heading.
      // Being siblings in the identity block is fine; the action must simply
      // come after the name block rather than being jammed inline with it.
      const heading = screen.getByRole("heading", { level: 1 });
      const primaryAction = elements.getPrimaryAction();
      expect(primaryAction.contains(heading)).toBe(false);
    });
  });

  describe("given isOwnProfile is false (AC PRO-2 no primary action for visitor)", () => {
    it("does not render a primary action when no headerActions slot is provided", () => {
      render(
        <ProfileOverview
          profile={stubProfile}
          stats={stubStats}
          isOwnProfile={false}
        />
      );
      expect(elements.queryPrimaryAction()).toBeNull();
    });
  });

  describe("given a headerActions slot is provided (AC PRO-2 custom primary action)", () => {
    it("renders the slot as the primary action with full-width wrapper", () => {
      render(
        <ProfileOverview
          profile={stubProfile}
          stats={stubStats}
          headerActions={<button data-testid="custom-action">Follow</button>}
        />
      );
      const primaryAction = elements.getPrimaryAction();
      expect(primaryAction).toBeDefined();
      expect(primaryAction.className).toContain("w-full");
      expect(within(primaryAction).getByTestId("custom-action")).toBeDefined();
    });
  });
});
