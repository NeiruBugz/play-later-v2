/**
 * Acquisition metadata for the library taxonomy. The entity layer owns the
 * `AcquisitionType` shape, its display labels, and the rule for when a chip is
 * worth showing. Features (e.g. `filter-library`) compose on top.
 *
 * SUBSCRIPTION is stored as a single enum value but reads contextually as the
 * platform's subscription brand — Game Pass on Xbox/PC, PS+ on PlayStation —
 * because that is how players actually think about a rented game. The DB never
 * distinguishes the two; only the label does.
 */

import type { AcquisitionType } from "../../../../shared/lib/prisma/client.ts";

export type { AcquisitionType };

export type AcquisitionChipEmphasis = "subscription" | "owned" | "physical";

export type AcquisitionFilterEntry = {
  value: AcquisitionType;
  label: string;
};

/**
 * Filter options key on the three real enum values. SUBSCRIPTION is labelled
 * generically ("Subscription") here because the DB cannot tell Game Pass from
 * PS+ — only the per-card platform context can, and that lives in the chip.
 */
export const ACQUISITION_FILTER_ENTRIES: ReadonlyArray<AcquisitionFilterEntry> =
  [
    { value: "DIGITAL", label: "Owned" },
    { value: "SUBSCRIPTION", label: "Subscription" },
    { value: "PHYSICAL", label: "Physical" },
  ];

export function resolveAcquisitionLabel(
  acquisitionType: AcquisitionType,
  platform: string | null | undefined
): string {
  switch (acquisitionType) {
    case "PHYSICAL":
      return "Physical";
    case "DIGITAL":
      return "Owned";
    case "SUBSCRIPTION":
      return resolveSubscriptionBrand(platform);
    default: {
      const _exhaustive: never = acquisitionType;
      throw new Error(`Unknown acquisition type: ${String(_exhaustive)}`);
    }
  }
}

export function resolveAcquisitionEmphasis(
  acquisitionType: AcquisitionType
): AcquisitionChipEmphasis {
  switch (acquisitionType) {
    case "SUBSCRIPTION":
      return "subscription";
    case "PHYSICAL":
      return "physical";
    case "DIGITAL":
      return "owned";
    default: {
      const _exhaustive: never = acquisitionType;
      throw new Error(`Unknown acquisition type: ${String(_exhaustive)}`);
    }
  }
}

/**
 * The chip carries signal only for the non-default sources. DIGITAL ("Owned")
 * is the column default and the overwhelmingly common case; rendering it on
 * every card is noise, so its absence reliably reads as "owned digital copy".
 * Subscriptions and physical media are the exceptions worth flagging — that is
 * exactly the rented-vs-owned distinction F03 set out to make legible.
 */
export function shouldShowAcquisitionChip(
  acquisitionType: AcquisitionType
): boolean {
  return acquisitionType !== "DIGITAL";
}

function resolveSubscriptionBrand(platform: string | null | undefined): string {
  const normalized = (platform ?? "").toLowerCase();
  if (
    normalized.includes("xbox") ||
    normalized.includes("pc") ||
    normalized.includes("windows")
  ) {
    return "Game Pass";
  }
  if (normalized.includes("playstation") || /\bps\d?\b/.test(normalized)) {
    return "PS+";
  }
  return "Subscription";
}
