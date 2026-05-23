import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LandingFeaturesStrip, LandingPreviewCard } from "./landing-features";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, href, children, ...rest }: any) => (
    <a href={to ?? href} {...rest}>
      {children}
    </a>
  ),
}));

describe("LandingFeaturesStrip", () => {
  describe("given the features strip is rendered", () => {
    beforeEach(() => {
      render(<LandingFeaturesStrip />);
    });

    it("renders the Library title", () => {
      expect(screen.getByText("Library")).toBeDefined();
    });

    it("renders the Library sub-copy", () => {
      expect(screen.getByText(/All platforms/, { exact: false })).toBeDefined();
    });

    it("renders the Journal title", () => {
      expect(screen.getByText("Journal")).toBeDefined();
    });

    it("renders the Journal sub-copy", () => {
      expect(
        screen.getByText(/Reflect, don't review/, { exact: false })
      ).toBeDefined();
    });

    it("renders the Timeline title", () => {
      expect(screen.getByText("Timeline")).toBeDefined();
    });

    it("renders the Timeline sub-copy", () => {
      expect(
        screen.getByText(/chronologically/, { exact: false })
      ).toBeDefined();
    });
  });
});

describe("LandingPreviewCard", () => {
  describe("given the preview card is rendered", () => {
    beforeEach(() => {
      render(<LandingPreviewCard />);
    });

    it("renders the Hollow Knight title", () => {
      expect(screen.getByText("Hollow Knight")).toBeDefined();
    });

    it("renders the CURRENTLY EXPLORING chip", () => {
      expect(screen.getByText("CURRENTLY EXPLORING")).toBeDefined();
    });

    it("renders the team / year sub-text", () => {
      expect(screen.getByText(/TEAM CHERRY/, { exact: false })).toBeDefined();
    });

    it("renders the journal entry chip", () => {
      expect(screen.getByText(/JOURNAL ENTRY/, { exact: false })).toBeDefined();
    });

    it("renders the journal quote", () => {
      expect(
        screen.getByText(/Took five tries on Hornet/, { exact: false })
      ).toBeDefined();
    });

    it("renders the UP NEXT label", () => {
      expect(screen.getByText("UP NEXT")).toBeDefined();
    });

    it("renders the library count indicator", () => {
      expect(
        screen.getByText(/218 in your library/, { exact: false })
      ).toBeDefined();
    });
  });
});
