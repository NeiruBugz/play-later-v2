import { LibraryFilters } from "@/features/library/ui/library-filters";
import { LibraryGrid } from "@/features/library/ui/library-grid";

type LibraryPageViewProps = {
  isSteamConnected: boolean;
};

export function LibraryPageView({ isSteamConnected }: LibraryPageViewProps) {
  return (
    <div className="py-2xl container mx-auto">
      <div className="mb-xl">
        <h1 className="heading-lg y2k-chrome-text">Library</h1>
      </div>
      <LibraryFilters isSteamConnected={isSteamConnected} />
      <LibraryGrid />
    </div>
  );
}
