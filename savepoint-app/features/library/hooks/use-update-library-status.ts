"use client";
import type { LibraryItemStatus } from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateLibraryStatusAction } from "../server-actions/update-library-status";
import type { LibraryItemWithGameAndCount } from "./use-library-data";
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
    // Optimistic update: Update cache before server responds
    onMutate: async (params: UpdateLibraryStatusParams) => {
      // Cancel any in-flight queries to avoid race conditions
      await queryClient.cancelQueries({ queryKey: ["library"] });
      // Snapshot current cache state for rollback
      const previousLibrary = queryClient.getQueriesData({
        queryKey: ["library"],
      });
      // Optimistically update all matching library queries
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
      // Return context with previous state for rollback
      return { previousLibrary };
    },
    // Rollback on error
    onError: (error, _variables, context) => {
      // Restore previous cache state
      if (context?.previousLibrary) {
        context.previousLibrary.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      // Show error toast
      toast.error("Failed to update status", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    },
    // Success notification
    onSuccess: () => {
      toast.success("Status updated");
    },
    // Always refetch after mutation settles (success or error)
    onSettled: () => {
      // Invalidate all library queries to refetch from server
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}
