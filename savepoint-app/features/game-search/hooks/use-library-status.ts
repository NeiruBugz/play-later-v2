import { useEffect, useState } from "react";

import { getLibraryStatusForGames } from "@/features/manage-library-entry/server-actions";
import type { LibraryItemStatus } from "@/shared/types";

export function useLibraryStatus(igdbIds: number[], isAuthenticated: boolean) {
  const [statusMap, setStatusMap] = useState<
    Record<number, LibraryItemStatus | null>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || igdbIds.length === 0) {
      setStatusMap({});
      return;
    }

    const fetchStatuses = async () => {
      setIsLoading(true);
      try {
        const result = await getLibraryStatusForGames({ igdbIds });
        if (result.success && result.data) {
          setStatusMap(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch library status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStatuses();
  }, [igdbIds, isAuthenticated]);

  return {
    statusMap,
    isLoading,
  };
}
