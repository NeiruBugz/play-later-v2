import { render, screen } from "@testing-library/react";

import { ProfileTabNav } from "./profile-tab-nav";

const mockUsePathname = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: mockPush }),
}));

function renderTabNav(username = "gamer42") {
  return render(<ProfileTabNav username={username} />);
}

describe("ProfileTabNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("tab rendering", () => {
    beforeEach(() => {
      mockUsePathname.mockReturnValue("/u/gamer42");
    });

    it("renders an Overview tab", () => {
      renderTabNav();

      expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument();
    });

    it("renders a Library tab", () => {
      renderTabNav();

      expect(screen.getByRole("tab", { name: "Library" })).toBeInTheDocument();
    });

    it("renders an Activity tab", () => {
      renderTabNav();

      expect(screen.getByRole("tab", { name: "Activity" })).toBeInTheDocument();
    });

    it("renders inside a nav landmark with label 'Profile sections'", () => {
      renderTabNav();

      expect(
        screen.getByRole("navigation", { name: "Profile sections" })
      ).toBeInTheDocument();
    });
  });

  describe("active state — Overview tab", () => {
    beforeEach(() => {
      mockUsePathname.mockReturnValue("/u/gamer42");
    });

    it("marks the Overview tab as active when pathname is /u/{username}", () => {
      renderTabNav();

      expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("does not mark the Library tab as active when pathname is /u/{username}", () => {
      renderTabNav();

      expect(screen.getByRole("tab", { name: "Library" })).not.toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("does not mark the Activity tab as active when pathname is /u/{username}", () => {
      renderTabNav();

      expect(screen.getByRole("tab", { name: "Activity" })).not.toHaveAttribute(
        "aria-current",
        "page"
      );
    });
  });

  describe("active state — Library tab", () => {
    beforeEach(() => {
      mockUsePathname.mockReturnValue("/u/gamer42/library");
    });

    it("marks the Library tab as active when pathname is /u/{username}/library", () => {
      renderTabNav();

      expect(screen.getByRole("tab", { name: "Library" })).toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("does not mark the Overview tab as active when pathname is /u/{username}/library", () => {
      renderTabNav();

      expect(screen.getByRole("tab", { name: "Overview" })).not.toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("does not mark the Activity tab as active when pathname is /u/{username}/library", () => {
      renderTabNav();

      expect(screen.getByRole("tab", { name: "Activity" })).not.toHaveAttribute(
        "aria-current",
        "page"
      );
    });
  });

  describe("active state — Activity tab", () => {
    beforeEach(() => {
      mockUsePathname.mockReturnValue("/u/gamer42/activity");
    });

    it("marks the Activity tab as active when pathname is /u/{username}/activity", () => {
      renderTabNav();

      expect(screen.getByRole("tab", { name: "Activity" })).toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("does not mark the Overview tab as active when pathname is /u/{username}/activity", () => {
      renderTabNav();

      expect(screen.getByRole("tab", { name: "Overview" })).not.toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("does not mark the Library tab as active when pathname is /u/{username}/activity", () => {
      renderTabNav();

      expect(screen.getByRole("tab", { name: "Library" })).not.toHaveAttribute(
        "aria-current",
        "page"
      );
    });
  });

  describe("username in tab values", () => {
    beforeEach(() => {
      mockUsePathname.mockReturnValue("/u/streamer99");
    });

    it("marks the Overview tab active for the given username", () => {
      renderTabNav("streamer99");

      expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("renders all three tabs for a different username", () => {
      renderTabNav("streamer99");

      expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Library" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Activity" })).toBeInTheDocument();
    });
  });
});
