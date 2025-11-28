import type { LibraryItemWithGameDomain } from "@/data-access-layer/domain/library";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { LibraryCard } from "@/features/library/ui/library-card";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/ui";

interface DashboardGameSectionProps {
  title: string;
  items: LibraryItemWithGameDomain[];
  viewAllHref: string;
  viewAllLabel?: string;
  emptyMessage?: string;
  className?: string;
}

export function DashboardGameSection({
  title,
  items,
  viewAllHref,
  viewAllLabel = "View All",
  emptyMessage = "No games to show",
  className,
}: DashboardGameSectionProps) {
  return (
    <section className={cn("space-y-xl", className)}>
      <div className="flex items-center justify-between">
        <h2 className="heading-lg font-serif">{title}</h2>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={viewAllHref} className="group">
              {viewAllLabel}
              <ChevronRight className="ml-sm h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        )}
      </div>

      {items.length > 0 ? (
        <div className="gap-lg grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item, index) => (
            <LibraryCard key={item.id} item={item} index={index} />
          ))}
        </div>
      ) : (
        <EmptySection message={emptyMessage} href={viewAllHref} />
      )}
    </section>
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
