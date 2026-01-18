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

    let isCurrent = true;

    const fetchStatuses = async () => {
      setIsLoading(true);
      try {
        const result = await getLibraryStatusForGames({ igdbIds });
        if (isCurrent && result.success && result.data) {
          setStatusMap(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch library status:", error);
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    void fetchStatuses();

    return () => {
      isCurrent = false;
    };
  }, [igdbIds, isAuthenticated]);

  return {
    statusMap,
    isLoading,
  };
}
