import { Archive, CheckCircle, Gamepad2, type LucideIcon } from "lucide-react";

import type { PlaythroughStatus } from "../../../../shared/lib/prisma/client.ts";

export type RunStatusEntry = {
  label: string;
  icon: LucideIcon;
  token: string;
};

export const RUN_STATUS: Record<PlaythroughStatus, RunStatusEntry> = {
  PLAYING: { label: "Playing", icon: Gamepad2, token: "playing" },
  FINISHED: { label: "Finished", icon: CheckCircle, token: "played" },
  ABANDONED: { label: "Abandoned", icon: Archive, token: "shelf" },
};
