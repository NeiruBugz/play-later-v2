"use client";

import type { LibraryItemStatus } from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { LibraryItemWithGameAndCount } from "@/shared/types";

import { updateLibraryStatusAction } from "../server-actions/update-library-status";

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

      queryClient.setQueriesData<LibraryItemWithGameAndCount[]>(
        { queryKey: ["library"] },
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map((item) =>
            item.id === params.libraryItemId
              ? { ...item, status: params.status }
              : item
          );
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
