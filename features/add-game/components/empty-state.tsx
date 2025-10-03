"use client";

import { Body, Heading } from "@/shared/components/typography";

export function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-muted-foreground/25 p-8">
      <div className="space-y-3 text-center">
        <div className="text-muted-foreground">
          <svg
            className="mx-auto size-12 text-muted-foreground/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <Heading level={3} size="md">
          Select a game to continue
        </Heading>
        <Body size="sm" variant="muted" className="mx-auto max-w-sm">
          Once you choose a game, you&apos;ll be able to set your platform
          preference, library status, and how you acquired the game.
        </Body>
      </div>
    </div>
  );
}
