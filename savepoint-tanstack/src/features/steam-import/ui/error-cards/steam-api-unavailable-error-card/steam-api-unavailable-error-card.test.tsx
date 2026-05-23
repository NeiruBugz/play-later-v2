import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SteamApiUnavailableErrorCard } from "./steam-api-unavailable-error-card";

const elements = {
  queryTitle: () => screen.queryByText("Steam Service Unavailable"),
  queryMessage: (m: string) => screen.queryByText(m),
  getRetryButton: () => screen.getByRole("button", { name: "Try Again" }),
  queryRetryButton: () => screen.queryByRole("button", { name: "Try Again" }),
};

describe("SteamApiUnavailableErrorCard", () => {
  describe("given a message and onRetry handler", () => {
    const onRetry = vi.fn();
    beforeEach(() => {
      onRetry.mockReset();
      render(
        <SteamApiUnavailableErrorCard
          message="Steam is down"
          onRetry={onRetry}
        />
      );
    });

    it("renders the locked title", () => {
      expect(elements.queryTitle()).not.toBeNull();
    });

    it("renders the message verbatim", () => {
      expect(elements.queryMessage("Steam is down")).not.toBeNull();
    });

    it("invokes onRetry when Try Again is clicked", async () => {
      await userEvent.click(elements.getRetryButton());
      expect(onRetry).toHaveBeenCalledOnce();
    });
  });

  describe("given no onRetry handler", () => {
    beforeEach(() => {
      render(<SteamApiUnavailableErrorCard message="msg" />);
    });

    it("hides the Try Again button", () => {
      expect(elements.queryRetryButton()).toBeNull();
    });
  });
});
