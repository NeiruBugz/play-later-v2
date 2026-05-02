"use client";

import { BookMarked, BookOpen, Settings, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/shared/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar";
import { cn } from "@/shared/lib/ui/utils";

import { SidebarSearchTrigger } from "./sidebar-search-trigger";

const NAV_LINKS = [
  { href: "/library", label: "Library", icon: BookMarked },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

interface AppSidebarProps {
  userSlot: ReactNode;
}

export function AppSidebar({ userSlot }: AppSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <Sidebar
      collapsible="icon"
      className="y2k-glass-strong jewel-glass-strong border-sidebar-border border-r"
    >
      <SidebarHeader className="pb-0">
        <Link
          href="/dashboard"
          className="gap-md flex items-center px-2 py-3"
          aria-label="SavePoint home"
        >
          <Image
            src="/logo.svg"
            alt="SavePoint Logo"
            width={32}
            height={32}
            className="y2k-logo-glow jewel-logo-glow h-8 w-8 shrink-0"
          />
          <span
            className={cn(
              "text-h3 y2k-chrome-text y2k:tracking-wider jewel-display jewel:tracking-[0.14em]",
              "group-data-[collapsible=icon]:hidden"
            )}
          >
            SavePoint
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarSearchTrigger />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={label}
                      className={cn(
                        active
                          ? "y2k-neon-text jewel-nav-active"
                          : "jewel-nav-inactive"
                      )}
                    >
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between px-2 pb-1 group-data-[collapsible=icon]:justify-center">
          <ThemeToggle />
        </div>
        {userSlot}
      </SidebarFooter>
    </Sidebar>
  );
}
