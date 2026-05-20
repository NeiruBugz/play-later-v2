import { Link } from "@tanstack/react-router";
import { Settings, UserCircle2 } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { SettingsRailProps } from "./settings-rail.type";

// Settings-rail widget: vertical nav at md+, horizontal-scroll nav stacked
// above content at <md. Two destinations today (Profile | Account); shape
// allows adding more without restructuring callers.
const ITEMS = [
  {
    to: "/settings/profile",
    label: "Profile",
    segment: "profile",
    icon: UserCircle2,
  },
  {
    to: "/settings/account",
    label: "Account",
    segment: "account",
    icon: Settings,
  },
] as const;

export function SettingsRail({ activeSegment }: SettingsRailProps) {
  return (
    <nav
      aria-label="Settings"
      data-testid="settings-rail"
      className="flex flex-row gap-1 overflow-x-auto md:flex-col md:gap-0.5"
    >
      {ITEMS.map(({ to, label, segment, icon: Icon }) => {
        const isActive = activeSegment === segment;
        return (
          <Link
            key={to}
            to={to}
            data-active={isActive ? "" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              "hover:bg-muted/60 hover:text-foreground",
              isActive ? "bg-muted text-foreground" : "text-muted-foreground"
            )}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
