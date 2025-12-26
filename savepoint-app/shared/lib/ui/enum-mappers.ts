import type { AcquisitionType } from "@/data-access-layer/domain/library";

export const AcquisitionStatusMapper: Record<AcquisitionType, string> = {
  DIGITAL: "Digital",
  PHYSICAL: "Physical",
  SUBSCRIPTION: "Subscription service",
  GIFT: "Gift",
  FREE: "Free to Play",
};
