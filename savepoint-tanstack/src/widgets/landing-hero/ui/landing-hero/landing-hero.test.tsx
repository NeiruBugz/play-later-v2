import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LandingHero } from "./landing-hero";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, href, children, ...rest }: any) => (
    <a href={to ?? href} {...rest}>
      {children}
    </a>
  ),
}));

const elements = {
  getChip: () => screen.getByText("FOR PATIENT GAMERS"),
  getHeadline: () => screen.getByRole("heading", { level: 1 }),
  getPrimaryCta: () => screen.getByRole("link", { name: /Start your library/ }),
  getSubCopy: () =>
    screen.getByText(/treat games as worlds, not chores/, { exact: false }),
  getBullet: (text: string) => screen.getByText(text),
};

describe("LandingHero", () => {
  describe("given the hero section is rendered", () => {
    beforeEach(() => {
      render(<LandingHero />);
    });

    it("renders the FOR PATIENT GAMERS chip", () => {
      expect(elements.getChip()).toBeDefined();
    });

    it("renders the H1 with the full headline 'A library, not a backlog.'", () => {
      expect(elements.getHeadline().textContent).toBe(
        "A library, not a backlog."
      );
    });

    it("renders the primary CTA linking to /login", () => {
      expect(elements.getPrimaryCta()).toHaveAttribute("href", "/login");
    });

    it("renders the sub-copy paragraph", () => {
      expect(elements.getSubCopy()).toBeDefined();
    });

    it("renders 'Free to start' bullet", () => {
      expect(elements.getBullet("Free to start")).toBeDefined();
    });

    it("renders 'Imports from Steam' bullet", () => {
      expect(elements.getBullet("Imports from Steam")).toBeDefined();
    });

    it("renders 'No credit card' bullet", () => {
      expect(elements.getBullet("No credit card")).toBeDefined();
    });
  });
});
