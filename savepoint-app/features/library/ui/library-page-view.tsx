import { Download } from "lucide-react";
import Link from "next/link";

import { LibraryFilters } from "@/features/library/ui/library-filters";
import { LibraryGrid } from "@/features/library/ui/library-grid";
import { Button } from "@/shared/components/ui/button";

type LibraryPageViewProps = {
  isSteamConnected: boolean;
};

export function LibraryPageView({ isSteamConnected }: LibraryPageViewProps) {
  return (
    <div className="py-3xl container mx-auto">
      <div className="mb-2xl gap-lg flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="heading-xl">My Library</h1>
        {isSteamConnected && (
          <Button asChild variant="default" size="sm">
            <Link href="/steam/games">
              <Download className="h-4 w-4" aria-hidden="true" />
              Import from Steam
            </Link>
          </Button>
        )}
      </div>
      <LibraryFilters />
      <LibraryGrid />
    </div>
  );
}
