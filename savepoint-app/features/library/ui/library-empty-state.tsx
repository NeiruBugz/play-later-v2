"use client";
import { Library } from "lucide-react";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
export function LibraryEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <Library className="text-muted-foreground mb-6 size-16" />
      <h2 className="mb-2 text-2xl font-semibold">Your Library is Empty</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Start building your gaming library by searching for games and adding
        them.
      </p>
      <Button asChild>
        <Link href="/games/search">Browse Games</Link>
      </Button>
    </div>
  );
}
