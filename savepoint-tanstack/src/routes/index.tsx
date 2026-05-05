import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { getCurrentUserFn } from "@/entities/session/api/get-current-user";
import {
  LandingFeaturesStrip,
  LandingPreviewCard,
} from "@/widgets/landing-features";
import { LandingHero } from "@/widgets/landing-hero";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { user } = await getCurrentUserFn();
    if (user) {
      throw redirect({ to: "/profile" });
    }
  },
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="dark bg-background text-foreground relative flex min-h-screen flex-col overflow-hidden">
      {/* Ambient violet glow */}
      <div
        aria-hidden="true"
        className="bg-primary/20 pointer-events-none absolute -top-32 -left-24 h-[480px] w-[480px] rounded-full blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 -bottom-40 h-[420px] w-[420px] rounded-full bg-fuchsia-500/10 blur-3xl"
      />

      <header className="relative flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16 xl:px-24 2xl:px-32">
        <Link
          to="/"
          aria-label="SavePoint"
          className="group flex items-center gap-3 no-underline"
        >
          <span
            aria-hidden="true"
            className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold shadow-sm"
          >
            S
          </span>
          <span className="text-foreground text-base font-semibold tracking-tight">
            SavePoint
          </span>
        </Link>
        <Link
          to="/login"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          Sign in
        </Link>
      </header>

      <div className="relative grid flex-1 grid-cols-1 gap-12 px-6 pb-10 sm:px-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-20 lg:px-16 lg:pb-16 xl:px-24 2xl:px-32">
        <div className="space-y-12">
          <LandingHero />
          <LandingFeaturesStrip />
        </div>
        <div>
          <LandingPreviewCard />
        </div>
      </div>
    </div>
  );
}
