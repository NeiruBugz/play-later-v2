import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary))/0.15,transparent_55%)]"
      />
      <div
        aria-live="polite"
        className="relative flex flex-col items-center gap-4 text-center"
        role="status"
      >
        <span className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-full">
          <Loader2 className="h-7 w-7 animate-spin" />
        </span>
        <div className="space-y-1.5">
          <p className="font-serif text-2xl font-semibold tracking-wide">
            SavePoint
          </p>
          <p className="text-muted-foreground text-sm">
            Loading your gaming library...
          </p>
        </div>
      </div>
    </div>
  );
}
