import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { SteamRateLimitErrorCard } from "./steam-rate-limit-error-card";

const elements = {
  queryTitle: () => screen.queryByText("Too Many Requests"),
  queryMessage: (m: string) => screen.queryByText(m),
  queryRetryButton: () => screen.queryByRole("button", { name: "Try Again" }),
};

describe("SteamRateLimitErrorCard", () => {
  describe("given a rate-limit message", () => {
    beforeEach(() => {
      render(<SteamRateLimitErrorCard message="slow down" />);
    });

    it("renders the locked title", () => {
      expect(elements.queryTitle()).not.toBeNull();
    });

    it("renders the message verbatim", () => {
      expect(elements.queryMessage("slow down")).not.toBeNull();
    });

    it("intentionally has no Try Again button (rate-limit-aware)", () => {
      expect(elements.queryRetryButton()).toBeNull();
    });
  });
});
