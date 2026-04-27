import type { AcquisitionType } from "@prisma/client";

export const AcquisitionStatusMapper: Record<AcquisitionType, string> = {
  DIGITAL: "Digital",
  PHYSICAL: "Physical",
  SUBSCRIPTION: "Subscription service",
};
