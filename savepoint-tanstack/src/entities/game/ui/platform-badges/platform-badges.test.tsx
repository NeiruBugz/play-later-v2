import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { PlatformBadges } from "./platform-badges";

const badgeClassNameFor = (text: HTMLElement | null): string => {
  // The Badge <div> carries the variant classes; the abbreviation/count text
  // lives inside it. Walking to the nearest classed ancestor reaches the Badge.
  // eslint-disable-next-line testing-library/no-node-access
  const badge = text?.closest("[class]");
  return badge?.className ?? "";
};

const elements = {
  queryChip: (label: string) => screen.queryByText(label),
  queryOverflowChip: () => screen.queryByText(/^\+\d+$/),
  chipVariantClass: (label: string) =>
    badgeClassNameFor(screen.queryByText(label)),
  overflowVariantClass: () => badgeClassNameFor(screen.queryByText(/^\+\d+$/)),
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

  describe("given platforms across distinct families", () => {
    beforeEach(() => {
      render(
        <PlatformBadges
          platforms={["PlayStation 5", "Xbox Series X|S", "Sega Genesis"]}
        />
      );
    });

    it("colors the PlayStation chip with the playstation brand variant", () => {
      expect(elements.chipVariantClass("PS5")).toContain("text-[#0070d1]");
    });

    it("colors the Xbox chip with the xbox brand variant", () => {
      expect(elements.chipVariantClass("XSX")).toContain("text-[#107c10]");
    });

    it("keeps an unrecognised platform on the neutral subtle variant", () => {
      const className = elements.chipVariantClass("Sega Genesis");
      expect(className).toContain("text-muted-foreground");
      expect(className).not.toContain("text-[#0070d1]");
    });
  });

  describe("given an overflow of platforms", () => {
    beforeEach(() => {
      render(
        <PlatformBadges
          platforms={[
            "PlayStation 5",
            "Xbox Series X|S",
            "Nintendo Switch",
            "PC (Microsoft Windows)",
            "Sega Genesis",
          ]}
        />
      );
    });

    it("keeps the overflow '+N' chip on the neutral subtle variant", () => {
      expect(elements.overflowVariantClass()).toContain(
        "text-muted-foreground"
      );
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
