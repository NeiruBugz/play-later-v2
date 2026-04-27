import { render, screen } from "@testing-library/react";

import { SettingsRail } from "./settings-rail";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("SettingsRail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    beforeEach(() => {
      mockUsePathname.mockReturnValue("/settings/profile");
    });

    it("renders a navigation landmark", () => {
      render(<SettingsRail />);
      expect(
        screen.getByRole("navigation", { name: "Settings sections" })
      ).toBeInTheDocument();
    });

    it("renders the Profile item", () => {
      render(<SettingsRail />);
      expect(
        screen.getByRole("link", { name: /profile/i })
      ).toBeInTheDocument();
    });

    it("renders the Account item", () => {
      render(<SettingsRail />);
      expect(
        screen.getByRole("link", { name: /account/i })
      ).toBeInTheDocument();
    });
  });

  describe("active state — profile section", () => {
    beforeEach(() => {
      mockUsePathname.mockReturnValue("/settings/profile");
    });

    it("marks the Profile link as active", () => {
      render(<SettingsRail />);
      expect(screen.getByRole("link", { name: /profile/i })).toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("does not mark the Account link as active", () => {
      render(<SettingsRail />);
      expect(
        screen.getByRole("link", { name: /account/i })
      ).not.toHaveAttribute("aria-current", "page");
    });
  });

  describe("active state — account section", () => {
    beforeEach(() => {
      mockUsePathname.mockReturnValue("/settings/account");
    });

    it("marks the Account link as active", () => {
      render(<SettingsRail />);
      expect(screen.getByRole("link", { name: /account/i })).toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("does not mark the Profile link as active", () => {
      render(<SettingsRail />);
      expect(
        screen.getByRole("link", { name: /profile/i })
      ).not.toHaveAttribute("aria-current", "page");
    });
  });
});
