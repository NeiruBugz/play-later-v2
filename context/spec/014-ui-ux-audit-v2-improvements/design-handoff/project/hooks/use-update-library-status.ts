"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { LibraryItemStatus } from "@/shared/types";

import { updateLibraryStatusAction } from "../server-actions/update-library-status";

type LibraryPageData = {
  items: { id: number; status: LibraryItemStatus }[];
  total: number;
  hasMore: boolean;
};

type InfiniteLibraryData = {
  pages: LibraryPageData[];
  pageParams: unknown[];
};

type UpdateLibraryStatusParams = {
  libraryItemId: number;
  status: LibraryItemStatus;
};

export function useUpdateLibraryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: UpdateLibraryStatusParams) => {
      const result = await updateLibraryStatusAction({
        libraryItemId: params.libraryItemId,
        status: params.status,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },

    onMutate: async (params: UpdateLibraryStatusParams) => {
      await queryClient.cancelQueries({ queryKey: ["library"] });

      const previousLibrary = queryClient.getQueriesData({
        queryKey: ["library"],
      });

      queryClient.setQueriesData<InfiniteLibraryData>(
        { queryKey: ["library"] },
        (oldData) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === params.libraryItemId
                  ? { ...item, status: params.status }
                  : item
              ),
            })),
          };
        }
      );

      return { previousLibrary };
    },

    onError: (error, _variables, context) => {
      if (context?.previousLibrary) {
        context.previousLibrary.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast.error("Failed to update status", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    },

    onSuccess: () => {
      toast.success("Status updated");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}
