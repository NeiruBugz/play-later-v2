import { render, screen } from "@testing-library/react";

import { ProfileTabNav } from "./profile-tab-nav";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

function renderTabNav(username = "gamer42") {
  return render(<ProfileTabNav username={username} />);
}

describe("ProfileTabNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("link rendering", () => {
    beforeEach(() => {
      mockUsePathname.mockReturnValue("/u/gamer42");
    });

    it("renders an Overview link", () => {
      renderTabNav();

      expect(
        screen.getByRole("link", { name: "Overview" })
      ).toBeInTheDocument();
    });

    it("renders a Library link", () => {
      renderTabNav();

      expect(screen.getByRole("link", { name: "Library" })).toBeInTheDocument();
    });

    it("renders an Activity link", () => {
      renderTabNav();

      expect(
        screen.getByRole("link", { name: "Activity" })
      ).toBeInTheDocument();
    });

    it("Overview link href points to /u/{username}", () => {
      renderTabNav();

      expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
        "href",
        "/u/gamer42"
      );
    });

    it("Library link href points to /u/{username}/library", () => {
      renderTabNav();

      expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute(
        "href",
        "/u/gamer42/library"
      );
    });

    it("Activity link href points to /u/{username}/activity", () => {
      renderTabNav();

      expect(screen.getByRole("link", { name: "Activity" })).toHaveAttribute(
        "href",
        "/u/gamer42/activity"
      );
    });

    it("uses the provided username in all hrefs", () => {
      renderTabNav("streamer99");

      expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
        "href",
        "/u/streamer99"
      );
      expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute(
        "href",
        "/u/streamer99/library"
      );
      expect(screen.getByRole("link", { name: "Activity" })).toHaveAttribute(
        "href",
        "/u/streamer99/activity"
      );
    });
  });

  describe("active state — Overview tab", () => {
    beforeEach(() => {
      mockUsePathname.mockReturnValue("/u/gamer42");
    });

    it("marks the Overview link as active when pathname is /u/{username}", () => {
      renderTabNav();

      expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("does not mark the Library link as active when pathname is /u/{username}", () => {
      renderTabNav();

      expect(screen.getByRole("link", { name: "Library" })).not.toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("does not mark the Activity link as active when pathname is /u/{username}", () => {
      renderTabNav();

      expect(
        screen.getByRole("link", { name: "Activity" })
      ).not.toHaveAttribute("aria-current", "page");
    });
  });

  describe("active state — Library tab", () => {
    beforeEach(() => {
      mockUsePathname.mockReturnValue("/u/gamer42/library");
    });

    it("marks the Library link as active when pathname is /u/{username}/library", () => {
      renderTabNav();

      expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("does not mark the Overview link as active when pathname is /u/{username}/library", () => {
      renderTabNav();

      expect(
        screen.getByRole("link", { name: "Overview" })
      ).not.toHaveAttribute("aria-current", "page");
    });

    it("does not mark the Activity link as active when pathname is /u/{username}/library", () => {
      renderTabNav();

      expect(
        screen.getByRole("link", { name: "Activity" })
      ).not.toHaveAttribute("aria-current", "page");
    });
  });

  describe("active state — Activity tab", () => {
    beforeEach(() => {
      mockUsePathname.mockReturnValue("/u/gamer42/activity");
    });

    it("marks the Activity link as active when pathname is /u/{username}/activity", () => {
      renderTabNav();

      expect(screen.getByRole("link", { name: "Activity" })).toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("does not mark the Overview link as active when pathname is /u/{username}/activity", () => {
      renderTabNav();

      expect(
        screen.getByRole("link", { name: "Overview" })
      ).not.toHaveAttribute("aria-current", "page");
    });

    it("does not mark the Library link as active when pathname is /u/{username}/activity", () => {
      renderTabNav();

      expect(screen.getByRole("link", { name: "Library" })).not.toHaveAttribute(
        "aria-current",
        "page"
      );
    });
  });
});
