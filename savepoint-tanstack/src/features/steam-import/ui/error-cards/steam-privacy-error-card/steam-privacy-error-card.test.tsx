import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SteamPrivacyErrorCard } from "./steam-privacy-error-card";

const elements = {
  queryTitle: () => screen.queryByText("Steam Profile Privacy Settings"),
  queryMessage: (m: string) => screen.queryByText(m),
  queryPrivacyLink: () =>
    screen.queryByRole("link", { name: /Open Privacy Settings/ }),
  getRetryButton: () => screen.getByRole("button", { name: "Try Again" }),
  queryRetryButton: () => screen.queryByRole("button", { name: "Try Again" }),
};

describe("SteamPrivacyErrorCard", () => {
  describe("given a message and onRetry handler", () => {
    const onRetry = vi.fn();
    beforeEach(() => {
      onRetry.mockReset();
      render(
        <SteamPrivacyErrorCard
          message="Your library is private"
          onRetry={onRetry}
        />
      );
    });

    it("renders the locked title", () => {
      expect(elements.queryTitle()).not.toBeNull();
    });

    it("renders the message verbatim", () => {
      expect(elements.queryMessage("Your library is private")).not.toBeNull();
    });

    it("renders the privacy-settings external link", () => {
      const link = elements.queryPrivacyLink();
      expect(link).not.toBeNull();
      expect(link).toHaveAttribute(
        "href",
        "https://steamcommunity.com/my/edit/settings"
      );
    });

    it("invokes onRetry when Try Again is clicked", async () => {
      await userEvent.click(elements.getRetryButton());
      expect(onRetry).toHaveBeenCalledOnce();
    });
  });

  describe("given no onRetry handler", () => {
    beforeEach(() => {
      render(<SteamPrivacyErrorCard message="msg" />);
    });

    it("hides the Try Again button", () => {
      expect(elements.queryRetryButton()).toBeNull();
    });
  });
});
