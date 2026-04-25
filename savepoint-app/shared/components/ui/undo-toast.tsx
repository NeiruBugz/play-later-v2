"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/ui/utils";

const DEFAULT_DURATION_MS = 5000;

export interface UndoToastBodyProps {
  message: string;
  onUndo: () => void;
  durationMs?: number;
  onExpire?: () => void;
}

export function UndoToastBody({
  message,
  onUndo,
  durationMs = DEFAULT_DURATION_MS,
  onExpire,
}: UndoToastBodyProps) {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setExpired(true);
      onExpire?.();
    }, durationMs);
    return () => window.clearTimeout(id);
  }, [durationMs, onExpire]);

  if (expired) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "bg-background text-foreground border-border",
        "rounded-md border shadow-lg",
        "gap-md p-md flex w-full items-center"
      )}
    >
      <span className="body-sm flex-1">{message}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onUndo}
        aria-label="Undo"
      >
        Undo
      </Button>
    </div>
  );
}

export interface ShowUndoToastOptions {
  message: string;
  onUndo: () => void;
  durationMs?: number;
}

export function showUndoToast({
  message,
  onUndo,
  durationMs = DEFAULT_DURATION_MS,
}: ShowUndoToastOptions): string | number {
  return toast(message, {
    duration: durationMs,
    action: {
      label: "Undo",
      onClick: () => {
        onUndo();
      },
    },
  });
}
