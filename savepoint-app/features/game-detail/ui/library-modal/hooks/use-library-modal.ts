"use client";

import type { LibraryItemDomain } from "@/shared/types";
import { useCallback, useEffect, useMemo, useReducer } from "react";

export type ModalView = "add" | "manage";

export interface LibraryModalState {
  view: ModalView;
  selectedEntryId: number | null;
  isAddingNew: boolean;
}

export type ModalAction =
  | { type: "SELECT_ENTRY"; id: number }
  | { type: "START_ADD_NEW" }
  | { type: "CANCEL_ADD_NEW" }
  | { type: "ENTRY_ADDED" }
  | { type: "ENTRY_UPDATED" }
  | { type: "ENTRY_DELETED"; id: number }
  | { type: "RESET" }
  | { type: "SET_VIEW"; view: ModalView; firstEntryId?: number };

function modalReducer(
  state: LibraryModalState,
  action: ModalAction
): LibraryModalState {
  switch (action.type) {
    case "SELECT_ENTRY":
      return {
        ...state,
        selectedEntryId: action.id,
        isAddingNew: false,
      };
    case "START_ADD_NEW":
      return {
        ...state,
        selectedEntryId: null,
        isAddingNew: true,
      };
    case "CANCEL_ADD_NEW":
      return {
        ...state,
        isAddingNew: false,
      };
    case "ENTRY_ADDED":
    case "ENTRY_UPDATED":
      return {
        ...state,
        isAddingNew: false,
      };
    case "ENTRY_DELETED": {
      return {
        ...state,
        selectedEntryId: null,
        isAddingNew: false,
      };
    }
    case "RESET":
      return {
        view: "add",
        selectedEntryId: null,
        isAddingNew: false,
      };
    case "SET_VIEW":
      return {
        view: action.view,
        selectedEntryId: action.view === "manage" ? (action.firstEntryId ?? null) : null,
        isAddingNew: false,
      };
    default:
      return state;
  }
}

const initialState: LibraryModalState = {
  view: "add",
  selectedEntryId: null,
  isAddingNew: false,
};

interface UseLibraryModalOptions {
  mode: "add" | "edit";
  existingItems: LibraryItemDomain[];
  isOpen: boolean;
}

export function useLibraryModal({
  mode,
  existingItems,
  isOpen,
}: UseLibraryModalOptions) {
  const [state, dispatch] = useReducer(modalReducer, initialState);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && existingItems.length > 0) {
        dispatch({
          type: "SET_VIEW",
          view: "manage",
          firstEntryId: existingItems[0].id,
        });
      } else {
        dispatch({ type: "SET_VIEW", view: "add" });
      }
    } else {
      dispatch({ type: "RESET" });
    }
  }, [isOpen, mode, existingItems.length]);

  const selectedEntry = useMemo(() => {
    if (state.selectedEntryId === null) return null;
    return existingItems.find((item) => item.id === state.selectedEntryId) ?? null;
  }, [state.selectedEntryId, existingItems]);

  const selectEntry = useCallback((id: number) => {
    dispatch({ type: "SELECT_ENTRY", id });
  }, []);

  const startAddNew = useCallback(() => {
    dispatch({ type: "START_ADD_NEW" });
  }, []);

  const cancelAddNew = useCallback(() => {
    dispatch({ type: "CANCEL_ADD_NEW" });
  }, []);

  const onEntryAdded = useCallback(() => {
    dispatch({ type: "ENTRY_ADDED" });
  }, []);

  const onEntryUpdated = useCallback(() => {
    dispatch({ type: "ENTRY_UPDATED" });
  }, []);

  const onEntryDeleted = useCallback((id: number) => {
    dispatch({ type: "ENTRY_DELETED", id });
  }, []);

  const existingPlatforms = useMemo(() => {
    return existingItems.map((item) => item.platform).filter(Boolean) as string[];
  }, [existingItems]);

  return {
    state,
    dispatch,
    selectedEntry,
    selectEntry,
    startAddNew,
    cancelAddNew,
    onEntryAdded,
    onEntryUpdated,
    onEntryDeleted,
    existingPlatforms,
    entries: existingItems,
  };
}

export type UseLibraryModalReturn = ReturnType<typeof useLibraryModal>;
