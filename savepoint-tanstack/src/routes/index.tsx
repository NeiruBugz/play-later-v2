import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { PRODUCT_NAME, socialMeta } from "@/shared/config/site";
import {
  LandingFeaturesStrip,
  LandingPreviewCard,
} from "@/widgets/landing-features";
import { LandingHero } from "@/widgets/landing-hero";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: ({ match }) => ({
    meta: socialMeta({ siteOrigin: match.context.siteOrigin, pathname: "/" }),
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16 xl:px-24 2xl:px-32">
        <Link
          to="/"
          aria-label={PRODUCT_NAME}
          className="group flex min-h-11 items-center gap-3 no-underline"
        >
          <img
            src="/logo.svg"
            alt=""
            aria-hidden="true"
            className="h-8 w-8 shrink-0"
          />
          <span className="font-display text-base font-bold tracking-tight text-foreground">
            {PRODUCT_NAME}
          </span>
        </Link>
        <Link
          to="/login"
          className="inline-flex min-h-11 min-w-11 items-center justify-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Sign in
        </Link>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-12 px-6 pb-10 sm:px-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-20 lg:px-16 lg:pb-16 xl:px-24 2xl:px-32">
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
