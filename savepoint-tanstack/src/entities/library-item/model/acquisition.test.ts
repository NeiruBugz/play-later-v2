import { describe, expect, it } from "vitest";

import {
  ACQUISITION_FILTER_ENTRIES,
  resolveAcquisitionEmphasis,
  resolveAcquisitionLabel,
  shouldShowAcquisitionChip,
} from "./acquisition";

describe("resolveAcquisitionLabel", () => {
  describe("given a SUBSCRIPTION item", () => {
    it("reads as Game Pass on Xbox and PC platforms", () => {
      expect(resolveAcquisitionLabel("SUBSCRIPTION", "Xbox Series X")).toBe(
        "Game Pass"
      );
      expect(resolveAcquisitionLabel("SUBSCRIPTION", "PC")).toBe("Game Pass");
    });

    it("reads as PS+ on PlayStation platforms", () => {
      expect(resolveAcquisitionLabel("SUBSCRIPTION", "PlayStation 5")).toBe(
        "PS+"
      );
      expect(resolveAcquisitionLabel("SUBSCRIPTION", "PS5")).toBe("PS+");
    });

    it("falls back to a generic label when platform is unknown", () => {
      expect(resolveAcquisitionLabel("SUBSCRIPTION", null)).toBe(
        "Subscription"
      );
      expect(resolveAcquisitionLabel("SUBSCRIPTION", "Switch")).toBe(
        "Subscription"
      );
    });
  });

  describe("given owned or physical items", () => {
    it("labels DIGITAL as Owned and PHYSICAL as Physical", () => {
      expect(resolveAcquisitionLabel("DIGITAL", "PC")).toBe("Owned");
      expect(resolveAcquisitionLabel("PHYSICAL", "Switch")).toBe("Physical");
    });
  });
});

describe("shouldShowAcquisitionChip", () => {
  it("suppresses the chip for the DIGITAL default", () => {
    expect(shouldShowAcquisitionChip("DIGITAL")).toBe(false);
  });

  it("shows the chip for subscription and physical sources", () => {
    expect(shouldShowAcquisitionChip("SUBSCRIPTION")).toBe(true);
    expect(shouldShowAcquisitionChip("PHYSICAL")).toBe(true);
  });
});

describe("resolveAcquisitionEmphasis", () => {
  it("maps each source to its chip emphasis token", () => {
    expect(resolveAcquisitionEmphasis("SUBSCRIPTION")).toBe("subscription");
    expect(resolveAcquisitionEmphasis("PHYSICAL")).toBe("physical");
    expect(resolveAcquisitionEmphasis("DIGITAL")).toBe("owned");
  });
});

describe("ACQUISITION_FILTER_ENTRIES", () => {
  it("offers exactly the three real enum values", () => {
    expect(ACQUISITION_FILTER_ENTRIES.map((e) => e.value)).toEqual([
      "DIGITAL",
      "SUBSCRIPTION",
      "PHYSICAL",
    ]);
  });
});
