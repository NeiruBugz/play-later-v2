import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { LibraryStats } from "@/entities/library-item/api/get-library-stats.server";
import type { Profile } from "@/entities/profile/model/types";

import { ProfileOverview } from "./profile-overview";

vi.mock("@/features/upload-avatar", () => ({
  AvatarUpload: ({ label }: { label?: string }) => (
    <div data-testid="avatar-upload-mock">{label ?? "Upload avatar"}</div>
  ),
}));

vi.mock("@/entities/profile/ui/overview-tab", () => ({
  OverviewTab: () => <div data-testid="overview-tab-mock" />,
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
    BACKLOG: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    ABANDONED: 0,
    FULL_COMPLETION: 0,
  } as never,
  recentGames: [],
} as unknown as LibraryStats;

describe("ProfileOverview", () => {
  describe("given isOwnProfile is true", () => {
    it("renders the change-avatar overlay trigger", () => {
      render(
        <ProfileOverview profile={stubProfile} stats={stubStats} isOwnProfile />
      );
      expect(screen.getByText("Change avatar")).toBeDefined();
    });
  });

  describe("given isOwnProfile is false", () => {
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
  });

  describe("given isOwnProfile is omitted", () => {
    it("does not render the change-avatar overlay trigger", () => {
      render(<ProfileOverview profile={stubProfile} stats={stubStats} />);
      expect(screen.queryByText("Change avatar")).toBeNull();
    });
  });
});
