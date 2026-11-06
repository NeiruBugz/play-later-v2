import { useNavigate } from "@tanstack/react-router";

import { openGlobalAction } from "@/shared/lib/global-action";
import { Button } from "@/shared/ui/button";
import { SectionLabel } from "@/shared/ui/section-label";

/**
 * Desktop-only stats rail for the journal page.
 *
 * Pairs with the timeline with a prompt to log time. It shows no counts
 * (spec 026 §2.17). Rendered only when `useIsDesktop()` is true — the
 * parent `JournalTimelinePage` owns the breakpoint gate.
 *
 * FSD: widget-internal component, not exported from the widget barrel.
 */
export function JournalStatsRail() {
  const navigate = useNavigate();

  return (
    <aside aria-label="Log tonight" className="flex flex-col gap-4">
      <div
        className="rounded-xl border bg-card p-[18px]"
        style={{
          background: "color-mix(in oklch, var(--primary) 6%, var(--card))",
          borderColor: "color-mix(in oklch, var(--primary) 22%, transparent)",
        }}
      >
        <SectionLabel className="mb-2">Log tonight</SectionLabel>
        <p className="mb-4 text-sm leading-relaxed text-foreground">
          Time played is enough — a note is optional.
        </p>
        <Button
          className="w-full"
          onClick={() => openGlobalAction(navigate, "log-session")}
        >
          Log time
        </Button>
      </div>
    </aside>
  );
}
