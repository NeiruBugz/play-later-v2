import type { ReactNode } from "react";

import type { GameDetailData } from "../game-detail/game-detail.type";

export type GameHeaderProps = {
  data: GameDetailData;
  eveningMinutes: number;
  actions?: ReactNode;
};
