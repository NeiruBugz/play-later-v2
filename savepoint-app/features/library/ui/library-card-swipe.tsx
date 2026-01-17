"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

import { cn } from "@/shared/lib/ui/utils";

interface LibraryCardSwipeProps {
  children: ReactNode;
  actionBar: ReactNode;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  className?: string;
}

const SWIPE_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 0.3;
const AUTO_CLOSE_DELAY = 3000;

export function LibraryCardSwipe({
  children,
  actionBar,
  onSwipeStart,
  onSwipeEnd,
  className,
}: LibraryCardSwipeProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const startTime = useRef(0);
  const autoCloseTimer = useRef<NodeJS.Timeout | null>(null);
  const isDragging = useRef(false);

  const clearAutoCloseTimer = useCallback(() => {
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }
  }, []);

  const startAutoCloseTimer = useCallback(() => {
    clearAutoCloseTimer();
    autoCloseTimer.current = setTimeout(() => {
      setTranslateX(0);
      setIsRevealed(false);
      onSwipeEnd?.();
    }, AUTO_CLOSE_DELAY);
  }, [clearAutoCloseTimer, onSwipeEnd]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "BUTTON" ||
        target.closest("button") ||
        target.hasAttribute("data-library-interactive") ||
        target.closest("[data-library-interactive]")
      ) {
        return;
      }

      isDragging.current = true;
      startX.current = e.touches[0].clientX;
      currentX.current = e.touches[0].clientX;
      startTime.current = Date.now();
      clearAutoCloseTimer();
    },
    [clearAutoCloseTimer]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current) return;

      currentX.current = e.touches[0].clientX;
      const diff = currentX.current - startX.current;

      if (diff < 0) {
        const resistance = isRevealed ? 0.3 : 1;
        setTranslateX(Math.max(diff * resistance, -120));
      } else if (isRevealed) {
        setTranslateX(Math.min(diff * 0.3, 0));
      }
    },
    [isRevealed]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;

    isDragging.current = false;
    const diff = currentX.current - startX.current;
    const duration = Date.now() - startTime.current;
    const velocity = Math.abs(diff) / duration;

    const shouldReveal =
      (!isRevealed &&
        (diff < -SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD)) ||
      (isRevealed && diff > -SWIPE_THRESHOLD);

    if (shouldReveal && !isRevealed) {
      setTranslateX(-120);
      setIsRevealed(true);
      onSwipeStart?.();
      startAutoCloseTimer();
    } else if (!shouldReveal && isRevealed) {
      setTranslateX(0);
      setIsRevealed(false);
      onSwipeEnd?.();
    } else if (isRevealed) {
      setTranslateX(-120);
      startAutoCloseTimer();
    } else {
      setTranslateX(0);
    }
  }, [isRevealed, onSwipeStart, onSwipeEnd, startAutoCloseTimer]);

  const handleActionClick = useCallback(() => {
    clearAutoCloseTimer();
    setTimeout(() => {
      setTranslateX(0);
      setIsRevealed(false);
      onSwipeEnd?.();
    }, 200);
  }, [clearAutoCloseTimer, onSwipeEnd]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="relative transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(${translateX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>

      <div
        className={cn(
          "pointer-events-none absolute top-0 right-0 h-full w-[120px]",
          "flex items-center justify-end",
          "transition-opacity duration-300",
          isRevealed ? "pointer-events-auto opacity-100" : "opacity-0"
        )}
        onClick={handleActionClick}
      >
        {actionBar}
      </div>

      {!isRevealed && (
        <div className="pointer-events-none absolute top-0 right-0 flex h-full w-12 items-center justify-center opacity-40">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="animate-pulse text-white/60"
            aria-hidden="true"
          >
            <path
              d="M12 4L8 10L12 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 4L12 10L16 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
