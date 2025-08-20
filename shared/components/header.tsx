"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  GamepadIcon,
  Library,
  ListChecks,
  MenuIcon,
  Plus,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { memo } from "react";

import { User } from "@/features/manage-user-info/components/user";
import { ThemeToggle } from "@/features/theme-toggle/components/theme-toggle";
import { Heading } from "@/shared/components/typography";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { cn } from "@/shared/lib";

const linksConfig = [
  {
    href: "/collection?status=PLAYING&page=1",
    label: "Collection",
    icon: Library,
    mobileLabel: "Collection",
    description: "Your game library",
  },
  {
    href: "/backlog",
    label: "Backlogs",
    icon: ListChecks,
    mobileLabel: "Backlogs",
    description: "Track your progress",
  },
] as const;

const headerVariants = cva(
  "fixed top-0 z-20 w-full transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        default:
          "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        gaming:
          "border-b border-gaming-primary/20 bg-gaming-primary/5 backdrop-blur-md shadow-gaming supports-[backdrop-filter]:bg-gaming-primary/10",
        neon: "border-b border-gaming-primary/30 bg-background/90 backdrop-blur-lg shadow-neon supports-[backdrop-filter]:bg-background/70",
        glass:
          "border-b border-white/10 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50",
        minimal:
          "border-b border-gaming-primary/10 bg-background/98 backdrop-blur supports-[backdrop-filter]:bg-background/95",
        clean:
          "border-b border-gaming-primary/8 bg-background supports-[backdrop-filter]:bg-background/100 shadow-sm",
        editorial:
          "border-b border-border/40 bg-background/98 backdrop-blur supports-[backdrop-filter]:bg-background/95",
      },
      scrolled: {
        true: "shadow-md",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      scrolled: false,
    },
  }
);

const logoVariants = cva("transition-all duration-200 ease-out", {
  variants: {
    variant: {
      default: "text-gaming-primary hover:text-gaming-primary/80",
      gaming:
        "text-gaming-primary hover:text-gaming-secondary animate-gaming-pulse",
      neon: "text-gaming-primary hover:text-gaming-accent neon-text",
      pulsing: "text-gaming-primary animate-pulse",
      minimal:
        "text-gaming-primary/90 hover:text-gaming-primary transition-colors duration-200",
      clean:
        "text-gaming-primary/80 hover:text-gaming-primary/90 transition-colors duration-150",
      editorial:
        "text-foreground hover:text-foreground/80 transition-colors duration-200",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const navItemVariants = cva(
  "flex items-center gap-2 transition-all duration-200 ease-out",
  {
    variants: {
      variant: {
        default: "hover:text-gaming-primary/80",
        gaming: "hover:text-gaming-primary hover:shadow-gaming",
        active: "text-gaming-primary font-semibold",
        minimal: "hover:text-gaming-primary/90 hover:bg-gaming-primary/5",
        clean: "hover:text-gaming-primary/80 hover:bg-gaming-primary/3",
        editorial: "hover:text-foreground hover:bg-muted/50",
      },
      size: {
        sm: "h-8 px-2 text-sm lg:px-3",
        default: "h-9 px-3 lg:px-4",
        lg: "h-10 px-4 lg:px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
);

export type HeaderProps = {
  authorized: boolean;
  variant?: VariantProps<typeof headerVariants>["variant"];
  logoVariant?: VariantProps<typeof logoVariants>["variant"];
  showScrollEffect?: boolean;
  className?: string;
};

const Header = memo(
  ({
    authorized,
    variant = "default",
    logoVariant = "default",
    showScrollEffect = true,
    className,
  }: HeaderProps) => {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = React.useState(false);

    // Handle scroll effect
    React.useEffect(() => {
      if (!showScrollEffect) return;

      const handleScroll = () => {
        const scrolled = window.scrollY > 10;
        setIsScrolled(scrolled);
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }, [showScrollEffect]);

    // Determine active navigation item
    const getActiveItem = (href: string) => {
      if (href.includes("/collection")) {
        return pathname.startsWith("/collection");
      }
      if (href.includes("/backlog")) {
        return pathname.startsWith("/backlog");
      }
      return false;
    };

    return (
      <header
        className={cn(
          headerVariants({
            variant,
            scrolled: showScrollEffect ? isScrolled : false,
          }),
          className
        )}
      >
        <div className="container flex h-14 max-w-screen-2xl items-center">
          {/* Mobile Menu */}
          {authorized && (
            <div className="mr-4 flex md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-gaming-primary/10 hover:text-gaming-primary size-8"
                  >
                    <MenuIcon className="size-4" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="border-gaming-primary/20 bg-gaming-primary/5 w-56 backdrop-blur-md"
                >
                  {linksConfig.map((link) => {
                    const IconComponent = link.icon;
                    const isActive = getActiveItem(link.href);
                    return (
                      <DropdownMenuItem
                        key={link.href}
                        className={cn(
                          "focus:bg-gaming-primary/20 focus:text-gaming-primary",
                          isActive &&
                            "bg-gaming-primary/10 text-gaming-primary font-medium"
                        )}
                      >
                        <Link
                          href={link.href}
                          className="flex w-full items-center gap-3"
                        >
                          <IconComponent className="size-4" />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {link.mobileLabel}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {link.description}
                            </span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Logo */}
          <div className="mr-4 flex items-center space-x-2 lg:mr-6">
            <Link
              href="/"
              className={cn(
                "group flex items-center space-x-2 transition-all duration-200 ease-out",
                variant === "editorial" ? "hover:opacity-80" : "hover:scale-105"
              )}
            >
              <div className="relative">
                <GamepadIcon
                  className={cn(
                    "size-5 transition-all duration-200 ease-out sm:size-6",
                    logoVariants({ variant: logoVariant })
                  )}
                />
                {(logoVariant === "gaming" || logoVariant === "neon") && (
                  <Zap className="text-gaming-accent absolute -right-1 -top-1 size-3 animate-pulse opacity-60" />
                )}
              </div>
              {variant === "editorial" ? (
                <>
                  <div className="font-heading hidden text-lg font-semibold tracking-tight text-foreground sm:inline-block lg:text-xl">
                    PlayLater
                  </div>
                  <div className="font-heading text-base font-semibold tracking-tight text-foreground sm:hidden">
                    PL
                  </div>
                </>
              ) : (
                <>
                  <Heading
                    level={1}
                    size="3xl"
                    className="lg:text-heading-md hidden font-bold sm:inline-block"
                  >
                    PlayLater
                  </Heading>
                  <div className="sm:hidden">
                    <Heading level={1} size="2xl">
                      PL
                    </Heading>
                  </div>
                </>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          {authorized && (
            <nav
              className={cn(
                "hidden flex-1 items-center md:flex",
                variant === "editorial"
                  ? "space-x-4 lg:space-x-8"
                  : "space-x-1 lg:space-x-2"
              )}
            >
              {linksConfig.map((link) => {
                const IconComponent = link.icon;
                const isActive = getActiveItem(link.href);
                return (
                  <Link key={link.href} href={link.href}>
                    {variant === "editorial" ? (
                      <div
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors duration-200",
                          isActive
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <IconComponent className="size-4" />
                        <span className="hidden lg:inline">{link.label}</span>
                        {isActive && (
                          <div className="ml-2 h-1 w-1 rounded-full bg-foreground" />
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          navItemVariants({
                            variant: isActive ? "active" : "gaming",
                            size: "sm",
                          }),
                          "hover:bg-gaming-primary/10 group relative hover:scale-105"
                        )}
                      >
                        <IconComponent className="size-4" />
                        <span className="hidden lg:inline">{link.label}</span>
                        {isActive && (
                          <div className="bg-gaming-primary absolute -bottom-1 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full" />
                        )}
                        <div className="bg-gaming-primary/0 group-hover:bg-gaming-primary/5 absolute inset-0 rounded-md transition-all duration-200" />
                      </Button>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Section */}
          {authorized && (
            <div className="flex flex-1 items-center justify-end space-x-2">
              <Link href="/collection/add-game">
                <Button
                  size="sm"
                  className={cn(
                    "flex h-8 items-center gap-2 transition-all duration-200",
                    variant === "editorial"
                      ? "hover:opacity-90"
                      : "hover:shadow-gaming-hover hover:scale-105"
                  )}
                >
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Add Game</span>
                </Button>
              </Link>

              <div className="flex items-center space-x-2">
                <User />
                <ThemeToggle />
              </div>
            </div>
          )}
        </div>

        {/* Gaming accent line */}
        {(variant === "gaming" || variant === "neon") && (
          <div className="via-gaming-primary absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-50" />
        )}
      </header>
    );
  }
);

Header.displayName = "Header";

// Gaming Header Presets
export const GamingHeader = memo((props: Omit<HeaderProps, "variant">) => (
  <Header {...props} variant="gaming" logoVariant="gaming" />
));
GamingHeader.displayName = "GamingHeader";

export const NeonHeader = memo((props: Omit<HeaderProps, "variant">) => (
  <Header {...props} variant="neon" logoVariant="neon" />
));
NeonHeader.displayName = "NeonHeader";

export const GlassHeader = memo((props: Omit<HeaderProps, "variant">) => (
  <Header {...props} variant="glass" logoVariant="default" />
));
GlassHeader.displayName = "GlassHeader";

export const MinimalHeader = memo((props: Omit<HeaderProps, "variant">) => (
  <Header {...props} variant="minimal" logoVariant="minimal" />
));
MinimalHeader.displayName = "MinimalHeader";

export const CleanHeader = memo((props: Omit<HeaderProps, "variant">) => (
  <Header {...props} variant="clean" logoVariant="clean" />
));
CleanHeader.displayName = "CleanHeader";

export const EditorialHeader = memo((props: Omit<HeaderProps, "variant">) => (
  <Header {...props} variant="editorial" logoVariant="editorial" />
));
EditorialHeader.displayName = "EditorialHeader";

export { Header, headerVariants, logoVariants, navItemVariants };
