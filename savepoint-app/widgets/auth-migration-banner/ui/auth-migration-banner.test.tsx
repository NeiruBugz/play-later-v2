import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCutoverAt, isInBannerWindow } from "@/features/auth/lib/cutover";

import { AuthMigrationBanner } from "./auth-migration-banner";
import { AuthMigrationBannerClient } from "./auth-migration-banner-client";

const STORAGE_KEY = "auth_migration_dismissed";

vi.mock("@/features/auth/lib/cutover", () => ({
  getCutoverAt: vi.fn(),
  isInBannerWindow: vi.fn(),
}));

const mockGetCutoverAt = vi.mocked(getCutoverAt);
const mockIsInBannerWindow = vi.mocked(isInBannerWindow);

const FIXTURE_CUTOVER = new Date("2026-06-01T12:00:00.000Z");

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("AuthMigrationBanner (server component)", () => {
  describe("when getCutoverAt() returns null", () => {
    it("renders nothing", () => {
      mockGetCutoverAt.mockReturnValue(null);
      mockIsInBannerWindow.mockReturnValue(false);

      render(<AuthMigrationBanner />);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("when now is inside the 48h banner window", () => {
    beforeEach(() => {
      mockGetCutoverAt.mockReturnValue(FIXTURE_CUTOVER);
      mockIsInBannerWindow.mockReturnValue(true);
    });

    it("renders the banner", () => {
      render(<AuthMigrationBanner />);

      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("contains a formatted date string with the cutover year", () => {
      render(<AuthMigrationBanner />);

      expect(screen.getByRole("status").textContent).toMatch(/2026/);
    });
  });

  describe("when now is at or after cutover (post-cutover)", () => {
    it("renders nothing", () => {
      mockGetCutoverAt.mockReturnValue(FIXTURE_CUTOVER);
      mockIsInBannerWindow.mockReturnValue(false);

      render(<AuthMigrationBanner />);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("when now is before the 48h banner window opens", () => {
    it("renders nothing", () => {
      mockGetCutoverAt.mockReturnValue(FIXTURE_CUTOVER);
      mockIsInBannerWindow.mockReturnValue(false);

      render(<AuthMigrationBanner />);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
});

describe("AuthMigrationBannerClient (client island)", () => {
  const FORMATTED_DATE = "June 1, 2026 at 12:00 PM UTC";

  describe("dismissal state", () => {
    it("shows the banner when auth_migration_dismissed is not set", () => {
      render(
        <AuthMigrationBannerClient formattedCutoverDate={FORMATTED_DATE} />
      );

      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("hides the banner when auth_migration_dismissed is already set in localStorage", () => {
      localStorage.setItem(STORAGE_KEY, "1");

      render(
        <AuthMigrationBannerClient formattedCutoverDate={FORMATTED_DATE} />
      );

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("dismisses the banner and sets localStorage when dismiss button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <AuthMigrationBannerClient formattedCutoverDate={FORMATTED_DATE} />
      );

      expect(screen.getByRole("status")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Dismiss" }));

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(localStorage.getItem(STORAGE_KEY)).toBe("1");
    });

    it("hides a visible banner when a cross-tab StorageEvent fires with the dismissed key", () => {
      render(
        <AuthMigrationBannerClient formattedCutoverDate={FORMATTED_DATE} />
      );
      expect(screen.getByRole("status")).toBeInTheDocument();

      localStorage.setItem(STORAGE_KEY, "1");

      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: STORAGE_KEY,
            newValue: "1",
            storageArea: localStorage,
          })
        );
      });

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("banner copy", () => {
    beforeEach(() => {
      render(
        <AuthMigrationBannerClient formattedCutoverDate={FORMATTED_DATE} />
      );
    });

    it("contains the sign-in system upgrade message", () => {
      expect(screen.getByRole("status").textContent).toMatch(
        /upgrading our sign-in system on/i
      );
    });

    it("contains the sign-out notice", () => {
      expect(screen.getByRole("status").textContent).toMatch(
        /signed out and need to sign in again/i
      );
    });

    it("contains the data-safety assurance", () => {
      expect(screen.getByRole("status").textContent).toMatch(
        /library, journal, and settings/i
      );
    });

    it("renders the formatted cutover date", () => {
      expect(screen.getByText(FORMATTED_DATE)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    beforeEach(() => {
      render(
        <AuthMigrationBannerClient formattedCutoverDate={FORMATTED_DATE} />
      );
    });

    it("banner element has role=status", () => {
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("dismiss button has accessible name Dismiss", () => {
      expect(
        screen.getByRole("button", { name: "Dismiss" })
      ).toBeInTheDocument();
    });
  });
});
