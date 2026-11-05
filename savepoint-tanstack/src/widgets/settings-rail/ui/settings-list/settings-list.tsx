import { Link } from "@tanstack/react-router";
import { ChevronRight, Settings, UserCircle2 } from "lucide-react";

import { ThemeToggle } from "@/features/toggle-theme";
import { cn } from "@/shared/lib/utils";
import { SectionLabel } from "@/shared/ui/section-label";

import type { SettingsListProps } from "./settings-list.type";

interface SettingsGroupProps {
  header?: string;
  children: React.ReactNode;
}

function SettingsGroup({ header, children }: SettingsGroupProps) {
  const headerId = header
    ? `settings-group-header-${header.toLowerCase()}`
    : undefined;
  return (
    <div className="mb-6">
      {header && (
        <SectionLabel data-testid={headerId} className="mb-2 px-1">
          {header}
        </SectionLabel>
      )}
      <div className="overflow-hidden rounded-xl border border-border/55 bg-card shadow-sm">
        {children}
      </div>
    </div>
  );
}

interface SettingsRowLinkProps {
  to: string;
  icon: React.ElementType;
  iconBg: string;
  label: string;
  isActive?: boolean;
  isLast?: boolean;
}

function SettingsRowLink({
  to,
  icon: Icon,
  iconBg,
  label,
  isActive,
  isLast,
}: SettingsRowLinkProps) {
  return (
    <Link
      to={to}
      data-active={isActive ? "" : undefined}
      data-testid="settings-row"
      className={cn(
        // Full-height tappable row (min 52 px matches design reference)
        "flex min-h-[52px] items-center gap-3 px-4 py-3 transition-colors",
        "hover:bg-muted/40 active:bg-muted/60",
        !isLast && "border-b border-border/45"
      )}
    >
      <span
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-white"
        style={{ background: iconBg }}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </span>
      <span
        className={cn(
          "flex-1 text-sm font-medium",
          isActive ? "text-foreground" : "text-foreground"
        )}
      >
        {label}
      </span>
      <ChevronRight
        className="h-4 w-4 text-muted-foreground/60"
        aria-hidden="true"
      />
    </Link>
  );
}

function AppearanceGroup() {
  return (
    <SettingsGroup header="Appearance">
      <div className="flex min-h-[52px] items-center justify-between gap-3 px-4 py-3">
        <span className="text-sm font-medium">Theme</span>
        <ThemeToggle />
      </div>
    </SettingsGroup>
  );
}

export function SettingsList({ activeSegment }: SettingsListProps) {
  return (
    <nav aria-label="Settings" data-testid="settings-list">
      <AppearanceGroup />

      <SettingsGroup header="Account">
        <SettingsRowLink
          to="/settings/profile"
          icon={UserCircle2}
          iconBg="var(--primary)"
          label="Profile"
          isActive={activeSegment === "profile"}
        />
        <SettingsRowLink
          to="/settings/account"
          icon={Settings}
          iconBg="var(--muted-foreground)"
          label="Account"
          isActive={activeSegment === "account"}
          isLast
        />
      </SettingsGroup>

      <footer className="mt-8 text-center text-xs text-muted-foreground">
        SavePoint · for patient gamers
      </footer>
    </nav>
  );
}
