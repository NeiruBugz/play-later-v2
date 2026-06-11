import type { PlaythroughStatus } from "../../../../../shared/lib/prisma/client.ts";

export type RunMarkerProps = {
  status: PlaythroughStatus;
  size?: number;
  ring?: boolean;
};
