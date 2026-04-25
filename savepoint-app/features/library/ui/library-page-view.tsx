import { HeroSearch } from "@/features/library/ui/hero-search";
import { LibraryFilterSidebar } from "@/features/library/ui/library-filter-sidebar";
import { LibraryFilterSidebarRail } from "@/features/library/ui/library-filter-sidebar-rail";
import { LibraryGrid } from "@/features/library/ui/library-grid";
import { MobileFilterBar } from "@/features/library/ui/mobile-filter-bar";

type LibraryPageViewProps = {
  isSteamConnected: boolean;
};

export function LibraryPageView({ isSteamConnected }: LibraryPageViewProps) {
  return (
    <div className="py-2xl container mx-auto">
      <div className="mb-xl">
        <h1 className="heading-lg y2k-chrome-text">Library</h1>
      </div>
      <div className="flex gap-6">
        <LibraryFilterSidebar />
        <LibraryFilterSidebarRail />
        <div className="min-w-0 flex-1">
          <HeroSearch />
          <div className="md:hidden" data-testid="mobile-filters">
            <MobileFilterBar isSteamConnected={isSteamConnected} />
          </div>
          <LibraryGrid />
        </div>
      </div>
    </div>
  );
}
