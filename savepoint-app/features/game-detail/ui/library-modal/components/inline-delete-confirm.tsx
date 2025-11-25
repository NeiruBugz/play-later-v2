"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/ui/utils";

interface InlineDeleteConfirmProps {
  onConfirm: () => void;
  isDeleting?: boolean;
  className?: string;
}

export function InlineDeleteConfirm({
  onConfirm,
  isDeleting = false,
  className,
}: InlineDeleteConfirmProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!showConfirm) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className={cn(
          "text-destructive hover:bg-destructive/10 hover:text-destructive",
          className
        )}
      >
        <Trash2 className="mr-sm h-4 w-4" aria-hidden />
        Delete Entry
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-md",
        "animate-in fade-in-0 zoom-in-95 duration-fast",
        className
      )}
    >
      <span className="text-muted-foreground text-sm">Delete this entry?</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowConfirm(false)}
        disabled={isDeleting}
      >
        Cancel
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={onConfirm}
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
