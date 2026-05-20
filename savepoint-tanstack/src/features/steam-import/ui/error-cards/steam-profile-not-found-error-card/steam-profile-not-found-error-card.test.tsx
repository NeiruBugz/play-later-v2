import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SteamProfileNotFoundErrorCard } from "./steam-profile-not-found-error-card";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

const elements = {
  queryTitle: () => screen.queryByText("Steam Profile Not Found"),
  queryMessage: (m: string) => screen.queryByText(m),
  queryReconnectLink: () =>
    screen.queryByRole("link", { name: "Reconnect Steam" }),
};

describe("SteamProfileNotFoundErrorCard", () => {
  describe("given a message", () => {
    beforeEach(() => {
      render(<SteamProfileNotFoundErrorCard message="not found" />);
    });

    it("renders the locked title", () => {
      expect(elements.queryTitle()).not.toBeNull();
    });

    it("renders the message verbatim", () => {
      expect(elements.queryMessage("not found")).not.toBeNull();
    });

    it("renders the Reconnect Steam link pointing at /settings/account", () => {
      const link = elements.queryReconnectLink();
      expect(link).not.toBeNull();
      expect(link).toHaveAttribute("href", "/settings/account");
    });
  });
});
