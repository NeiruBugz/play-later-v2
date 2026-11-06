import { cn } from "@/shared/lib/utils";

import type { GameDetailJumpSpineProps } from "./game-detail-jump-spine.type";

export function GameDetailJumpSpine({ sections }: GameDetailJumpSpineProps) {
  if (sections.length === 0) return null;

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      data-testid="game-detail-jump-spine"
      className={cn(
        "sticky top-0 z-20 -mx-6 overflow-x-auto",
        "bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "border-b"
      )}
    >
      <div className="flex min-w-max gap-1 px-4 py-2">
        {sections.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollTo(id)}
            className="min-h-11 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
