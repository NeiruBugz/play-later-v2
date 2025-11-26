import Image from "next/image";

import { ProgressRingSpinner } from "@/shared/components/ui/progress-ring";

export function LoadingScreen() {
  return (
    <div className="bg-background px-2xl relative flex min-h-screen items-center justify-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--status-playing)/0.15,transparent_55%)]"
      />
      <div
        aria-live="polite"
        className="animate-fade-in gap-xl relative flex flex-col items-center text-center"
        role="status"
      >
        <div className="relative">
          <ProgressRingSpinner size="lg" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="SavePoint Logo"
              width={40}
              height={40}
              className="opacity-80"
              priority
            />
          </div>
        </div>
        <div className="space-y-sm">
          <p className="heading-md font-serif tracking-wide">SavePoint</p>
          <p className="body-sm text-muted-foreground">
            Loading your gaming library...
          </p>
        </div>
      </div>
    </div>
  );
}
