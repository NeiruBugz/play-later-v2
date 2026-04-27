"use client";

import { Gem, Monitor, Moon, Sparkles, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/ui/utils";

const subscribeNoop = () => () => {};
const getMounted = () => true;
const getMountedServer = () => false;

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "y2k", label: "Y2K", icon: Sparkles },
  { value: "jewel", label: "Jewel", icon: Gem },
  { value: "system", label: "System", icon: Monitor },
] as const;

function ThemeIcon({
  theme,
  className,
}: {
  theme: string | undefined;
  className?: string;
}) {
  switch (theme) {
    case "dark":
      return <Moon className={className} />;
    case "y2k":
      return <Sparkles className={className} />;
    case "jewel":
      return <Gem className={className} />;
    case "system":
      return <Monitor className={className} />;
    case "light":
    default:
      return <Sun className={className} />;
  }
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeNoop,
    getMounted,
    getMountedServer
  );
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [open]);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8",
          theme === "y2k" && "y2k-text-glow text-primary",
          theme === "jewel" && "jewel-neon-text"
        )}
        onClick={() => setOpen(!open)}
        aria-label="Change theme"
        aria-expanded={open}
      >
        <ThemeIcon
          theme={theme}
          className="text-muted-foreground hover:text-foreground h-4 w-4 transition-colors"
        />
      </Button>

      {open && (
        <div
          className={cn(
            "border-border bg-popover text-popover-foreground shadow-paper-md absolute top-full right-0 z-50 mt-2 min-w-[140px] rounded-lg border p-1",
            "animate-scale-in",
            theme === "y2k" && "y2k-border-glow",
            theme === "jewel" && "jewel-glass-strong jewel-neon"
          )}
          role="menu"
        >
          {THEMES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              role="menuitem"
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                theme === value
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground"
              )}
              onClick={() => {
                setTheme(value);
                setOpen(false);
              }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
