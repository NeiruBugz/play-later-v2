import { AcquisitionType, BacklogItemStatus } from "@prisma/client";

import { type BacklogItemFormValues } from "@/features/add-game/types";
import { type SearchResponse } from "@/shared/types";

export const DEFAULT_PLATFORM_LIST: SearchResponse["platforms"] = [
  { id: 9999, name: "PC" },
  { id: 9998, name: "PlayStation" },
  { id: 9997, name: "Xbox" },
  { id: 9996, name: "Nintendo" },
  { id: 9995, name: "Other" },
];

export const initialFormValues: BacklogItemFormValues = {
  backlogStatus: BacklogItemStatus.TO_PLAY,
  acquisitionType: AcquisitionType.DIGITAL,
  platform: "",
};
