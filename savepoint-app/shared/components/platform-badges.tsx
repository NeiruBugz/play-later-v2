import { Badge } from "@/shared/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { getPlatformIcon } from "@/shared/lib/platform";

const MAX_VISIBLE_PLATFORMS = 4;

function abbreviatePlatformName(name: string): string {
  const abbreviations: Record<string, string> = {
    "playstation 5": "PS5",
    "playstation 4": "PS4",
    "playstation 3": "PS3",
    "playstation 2": "PS2",
    playstation: "PS1",
    "playstation vita": "Vita",
    "playstation portable": "PSP",
    "xbox series x|s": "XSX",
    "xbox series": "XSX",
    "xbox one": "XB1",
    "xbox 360": "X360",
    xbox: "Xbox",
    "nintendo switch": "Switch",
    switch: "Switch",
    "wii u": "Wii U",
    wii: "Wii",
    "nintendo gamecube": "GCN",
    gamecube: "GCN",
    "nintendo 64": "N64",
    "super nintendo entertainment system": "SNES",
    "nintendo entertainment system": "NES",
    "game boy advance": "GBA",
    "game boy color": "GBC",
    "game boy": "GB",
    "nintendo 3ds": "3DS",
    "new nintendo 3ds": "N3DS",
    "nintendo ds": "DS",
    "family computer": "FC",
    "family computer disk system": "FDS",
    satellaview: "BS-X",
    "pc (microsoft windows)": "PC",
    "pc windows": "PC",
    windows: "PC",
    mac: "Mac",
    macos: "Mac",
    linux: "Linux",
    "steam deck": "Deck",
    "game & watch": "G&W",
    "64dd": "64DD",
  };

  const lower = name.toLowerCase();
  return abbreviations[lower] || name;
}

export const PlatformBadges = ({ platforms }: { platforms: string[] }) => {
  const visible = platforms.slice(0, MAX_VISIBLE_PLATFORMS);
  const remaining = platforms.slice(MAX_VISIBLE_PLATFORMS);
  return (
    <TooltipProvider>
      <div className="gap-xs flex flex-wrap items-center">
        {visible.map((name) => {
          const Icon = getPlatformIcon(name);
          const abbreviated = abbreviatePlatformName(name);
          return (
            <Tooltip key={name}>
              <TooltipTrigger asChild>
                <Badge
                  variant="subtle"
                  className="gap-xs px-sm flex h-5 items-center text-[11px]"
                >
                  <Icon className="h-3 w-3 opacity-70" />
                  <span>{abbreviated}</span>
                </Badge>
              </TooltipTrigger>
              {abbreviated !== name && (
                <TooltipContent side="top">
                  <p>{name}</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
        {remaining.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="subtle"
                className="px-sm h-5 cursor-help text-[11px]"
              >
                +{remaining.length}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="max-w-xs">{remaining.join(", ")}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};
