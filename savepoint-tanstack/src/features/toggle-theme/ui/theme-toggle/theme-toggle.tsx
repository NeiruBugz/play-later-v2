import { Gamepad2, Monitor, Moon, Sparkles, Sun } from "lucide-react";
import { type ComponentType } from "react";

import { useTheme, type Theme } from "@/app/providers/theme-provider";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

// Theme value === CSS class name. Five user-selectable themes per canonical
// (light/dark/cartridge/aurora/system). The .y2k and .jewel CSS variants in
// styles.css are orphan — not reachable from this picker.
const THEMES: ReadonlyArray<{
  value: Theme;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "cartridge", label: "Cartridge", icon: Gamepad2 },
  { value: "aurora", label: "Aurora", icon: Sparkles },
  { value: "system", label: "System", icon: Monitor },
];

function getCurrentIcon(theme: Theme): ComponentType<{ className?: string }> {
  // Default to Sun for the unmounted/SSR fallback; matches canonical behaviour.
  const entry = THEMES.find((t) => t.value === theme);
  return entry?.icon ?? Sun;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const CurrentIcon = getCurrentIcon(theme);
  const currentLabel = THEMES.find((t) => t.value === theme)?.label ?? "Light";

  return (
    // Radix DropdownMenu provides roving-tabindex arrow-key navigation,
    // Enter/Space activation, Escape close, and click-outside dismissal
    // natively — no hand-rolled handlers needed. Deliberate improvement over
    // canonical, which uses a flat <div role="menu"> with no roving tabindex.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Change theme"
          className="gap-2"
        >
          <CurrentIcon className="h-4 w-4" />
          <span>{currentLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {THEMES.map(({ value, label, icon: Icon }) => {
          const active = theme === value;
          return (
            <DropdownMenuItem
              key={value}
              aria-current={active ? "true" : undefined}
              onSelect={() => setTheme(value)}
              className={
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground"
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
