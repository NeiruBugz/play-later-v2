import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { PlatformBadges } from "./platform-badges";

const elements = {
  queryChip: (label: string) => screen.queryByText(label),
  queryOverflowChip: () => screen.queryByText(/^\+\d+$/),
};

describe("PlatformBadges", () => {
  describe("given a single recognised platform", () => {
    beforeEach(() => {
      render(<PlatformBadges platforms={["PlayStation 5"]} />);
    });

    it("renders the abbreviated label rather than the full name", () => {
      expect(elements.queryChip("PS5")).not.toBeNull();
      expect(elements.queryChip("PlayStation 5")).toBeNull();
    });
  });

  describe("given an unrecognised platform name", () => {
    beforeEach(() => {
      render(<PlatformBadges platforms={["Atari Jaguar"]} />);
    });

    it("falls back to the full platform name as the chip label", () => {
      expect(elements.queryChip("Atari Jaguar")).not.toBeNull();
    });
  });

  describe("given exactly four platforms", () => {
    beforeEach(() => {
      render(
        <PlatformBadges
          platforms={[
            "Xbox Series X|S",
            "PlayStation 4",
            "PC (Microsoft Windows)",
            "Nintendo Switch",
          ]}
        />
      );
    });

    it("renders every platform as a visible chip", () => {
      expect(elements.queryChip("XSX")).not.toBeNull();
      expect(elements.queryChip("PS4")).not.toBeNull();
      expect(elements.queryChip("PC")).not.toBeNull();
      expect(elements.queryChip("Switch")).not.toBeNull();
    });

    it("does not render an overflow chip", () => {
      expect(elements.queryOverflowChip()).toBeNull();
    });
  });

  describe("given more than four platforms", () => {
    beforeEach(() => {
      render(
        <PlatformBadges
          platforms={[
            "Xbox Series X|S",
            "PlayStation 4",
            "PC (Microsoft Windows)",
            "PlayStation 5",
            "Nintendo Switch",
            "Linux",
          ]}
        />
      );
    });

    it("renders only the first four platforms as visible chips", () => {
      expect(elements.queryChip("XSX")).not.toBeNull();
      expect(elements.queryChip("PS4")).not.toBeNull();
      expect(elements.queryChip("PC")).not.toBeNull();
      expect(elements.queryChip("PS5")).not.toBeNull();
      expect(elements.queryChip("Switch")).toBeNull();
      expect(elements.queryChip("Linux")).toBeNull();
    });

    it("collapses the overflow into a single chip showing the remaining count", () => {
      expect(elements.queryOverflowChip()?.textContent).toBe("+2");
    });
  });
});
