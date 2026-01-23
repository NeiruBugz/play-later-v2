"use client";

import { useCallback, useEffect, useState } from "react";

import { getActiveAnnouncements, STORAGE_KEY } from "../config";
import type { FeatureAnnouncement } from "../types";

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

function getSeenIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSeenIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable
  }
}

export function useWhatsNew(): UseWhatsNewReturn {
  const [isHydrated, setIsHydrated] = useState(false);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const storedIds = getSeenIds();
    setSeenIds(storedIds);
    setIsHydrated(true);
  }, []);

  const activeAnnouncements = getActiveAnnouncements();
  const unseenAnnouncements = isHydrated
    ? activeAnnouncements.filter((a) => !seenIds.includes(a.id))
    : [];

  useEffect(() => {
    if (!isHydrated) return;
    if (unseenAnnouncements.length === 0) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isHydrated, unseenAnnouncements.length]);

  const markAsSeen = useCallback((id: string) => {
    setSeenIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      saveSeenIds(updated);
      return updated;
    });
  }, []);

  const dismiss = useCallback(() => {
    const current = unseenAnnouncements[currentIndex];
    if (current) {
      markAsSeen(current.id);
    }

    if (currentIndex < unseenAnnouncements.length - 1) {
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
