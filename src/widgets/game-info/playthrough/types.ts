import type { Game, Playthrough } from "@prisma/client";

import type { FullGameInfoResponse } from "../../../shared/types";

export type PlaythroughItemProps = {
  id: Playthrough["id"];
  label: Playthrough["label"];
  platform: Playthrough["platform"];
  platforms: FullGameInfoResponse["release_dates"];
};

export type PlaythroughsProps = {
  id: Game["id"];
  platforms: FullGameInfoResponse["release_dates"];
};
