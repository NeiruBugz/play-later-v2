import { Game } from "@prisma/client";
import { Clock } from "lucide-react";

export const GameTimeBadge = ({
  time,
}: {
  time: Game["gameplayTime"] | undefined;
}) => {
  if (!time) {
    return null;
  }

  return (
    <div className="flex w-fit items-center justify-center gap-1 rounded-full bg-slate-600 px-2 py-1 text-xs font-medium">
      <Clock className="size-3" />
      {time} h
    </div>
  );
};