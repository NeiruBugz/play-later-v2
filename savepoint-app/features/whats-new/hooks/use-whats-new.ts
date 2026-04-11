"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import {
  getActiveAnnouncements,
  STORAGE_KEY,
} from "@/features/whats-new/config";
import type { FeatureAnnouncement } from "@/features/whats-new/types";

const SHOW_DELAY_MS = 1000;

interface UseWhatsNewReturn {
  isOpen: boolean;
  currentAnnouncement: FeatureAnnouncement | null;
  unseenAnnouncements: FeatureAnnouncement[];
  currentIndex: number;
  totalCount: number;
  dismiss: () => void;
  dismissAll: () => void;
}

function readSeenIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function writeSeenIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable
  }
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => JSON.stringify(readSeenIds());
const getServerSnapshot = () => "[]";

function useSeenIds(): [string[], (id: string) => void] {
  const serialized = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const seenIds = useMemo<string[]>(() => JSON.parse(serialized), [serialized]);

  const markAsSeen = useCallback((id: string) => {
    const current = readSeenIds();
    if (current.includes(id)) return;
    const updated = [...current, id];
    writeSeenIds(updated);
    listeners.forEach((listener) => listener());
  }, []);

  return [seenIds, markAsSeen];
}

export function useWhatsNew(): UseWhatsNewReturn {
  const [seenIds, markAsSeen] = useSeenIds();
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeAnnouncements = getActiveAnnouncements();
  const unseenAnnouncements = useMemo(
    () => activeAnnouncements.filter((a) => !seenIds.includes(a.id)),
    [activeAnnouncements, seenIds]
  );

  const hasUnseen = unseenAnnouncements.length > 0;

  useEffect(() => {
    if (!hasUnseen) return;
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [hasUnseen]);

  const dismiss = useCallback(() => {
    const current = unseenAnnouncements[currentIndex];
    const hasMoreItems = currentIndex < unseenAnnouncements.length - 1;

    if (current) {
      markAsSeen(current.id);
    }

    if (hasMoreItems) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsOpen(false);
      setCurrentIndex(0);
    }
  }, [currentIndex, unseenAnnouncements, markAsSeen]);

  const dismissAll = useCallback(() => {
    unseenAnnouncements.forEach((a) => markAsSeen(a.id));
    setIsOpen(false);
    setCurrentIndex(0);
  }, [unseenAnnouncements, markAsSeen]);

  const currentAnnouncement = unseenAnnouncements[currentIndex] ?? null;

  return {
    isOpen,
    currentAnnouncement,
    unseenAnnouncements,
    currentIndex,
    totalCount: unseenAnnouncements.length,
    dismiss,
    dismissAll,
  };
}
