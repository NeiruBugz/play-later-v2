import { act, renderHook, waitFor } from "@testing-library/react";

import { LibraryItemStatus } from "@/shared/types";

import { useOptimisticLibraryStatus } from "./use-optimistic-library-status";

const mockUpdateLibraryStatusAction = vi.fn();
const mockToastError = vi.fn();

vi.mock("@/features/manage-library-entry/server-actions", () => ({
  updateLibraryStatusAction: (...args: unknown[]) =>
    mockUpdateLibraryStatusAction(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

const IGDB_ID = 1234;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useOptimisticLibraryStatus", () => {
  it("applies the optimistic status and persists it on success", async () => {
    mockUpdateLibraryStatusAction.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useOptimisticLibraryStatus(IGDB_ID, LibraryItemStatus.WISHLIST)
    );

    await act(async () => {
      result.current.setStatus(LibraryItemStatus.PLAYING);
    });

    expect(mockUpdateLibraryStatusAction).toHaveBeenCalledWith({
      igdbId: IGDB_ID,
      status: LibraryItemStatus.PLAYING,
    });
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("rolls back and toasts when the action returns success: false", async () => {
    mockUpdateLibraryStatusAction.mockResolvedValue({ success: false });

    const { result } = renderHook(() =>
      useOptimisticLibraryStatus(IGDB_ID, LibraryItemStatus.WISHLIST)
    );

    await act(async () => {
      result.current.setStatus(LibraryItemStatus.PLAYING);
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Failed to update library status"
      );
    });
    expect(result.current.optimisticStatus).toBe(LibraryItemStatus.WISHLIST);
  });

  it("rolls back and toasts when the action throws", async () => {
    mockUpdateLibraryStatusAction.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() =>
      useOptimisticLibraryStatus(IGDB_ID, LibraryItemStatus.WISHLIST)
    );

    await act(async () => {
      result.current.setStatus(LibraryItemStatus.PLAYING);
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledTimes(1);
    });
    expect(mockToastError).toHaveBeenCalledWith(
      "Failed to update library status"
    );
    expect(result.current.optimisticStatus).toBe(LibraryItemStatus.WISHLIST);
  });

  it("rolls back and toasts when the action resolves to null/undefined", async () => {
    mockUpdateLibraryStatusAction.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useOptimisticLibraryStatus(IGDB_ID, LibraryItemStatus.WISHLIST)
    );

    await act(async () => {
      result.current.setStatus(LibraryItemStatus.PLAYING);
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledTimes(1);
    });
    expect(result.current.optimisticStatus).toBe(LibraryItemStatus.WISHLIST);
  });
});
