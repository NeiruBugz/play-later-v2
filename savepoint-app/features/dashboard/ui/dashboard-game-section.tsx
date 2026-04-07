import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { LibraryItemWithGameDomain } from "@/features/library/types";
import { LibraryCard } from "@/features/library/ui/library-card";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/ui/utils";

interface DashboardGameSectionProps {
  title: string;
  items: LibraryItemWithGameDomain[];
  viewAllHref: string;
  viewAllLabel?: string;
  emptyMessage?: string;
  className?: string;
  variant?: "default" | "hero";
  totalCount?: number;
}

export function DashboardGameSection({
  title,
  items,
  viewAllHref,
  viewAllLabel = "View All",
  emptyMessage = "No games to show",
  className,
  variant = "default",
  totalCount,
}: DashboardGameSectionProps) {
  const gridClass =
    variant === "hero"
      ? "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
      : "grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7";

  return (
    <Card variant="flat" className={cn("p-lg overflow-hidden", className)}>
      <div className="mb-lg flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {items.length > 0 &&
          (totalCount === undefined || totalCount > items.length) && (
            <Button variant="ghost" size="sm" asChild className="h-auto p-0">
              <Link
                href={viewAllHref}
                className="text-muted-foreground hover:text-foreground group text-xs"
              >
                {viewAllLabel}
                <ChevronRight className="ml-xs h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          )}
      </div>

      {items.length > 0 ? (
        <div className={gridClass}>
          {items.map((item, index) => (
            <LibraryCard key={item.id} item={item} index={index} />
          ))}
        </div>
      ) : (
        <EmptySection message={emptyMessage} href={viewAllHref} />
      )}
    </Card>
  );
}

function EmptySection({ message, href }: { message: string; href: string }) {
  return (
    <div className="border-border bg-muted/30 p-3xl rounded-lg border border-dashed text-center">
      <p className="body-md text-muted-foreground mb-lg">{message}</p>
      <Button variant="outline" size="sm" asChild>
        <Link href={href}>Browse Games</Link>
      </Button>
    </div>
  );
}
