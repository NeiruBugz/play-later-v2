import { auth } from "@/auth";
import {
  ArrowDown,
  BarChart3,
  Calendar,
  Gamepad2,
  Heart,
  MessageSquare,
  Share2,
  Sparkles,
  TrendingUp,
} from "lucide-react/";
import { Suspense } from "react";

import {
  BacklogCount,
  CollectionStats,
  CurrentlyPlaying,
  PlatformBreakdown,
  RecentActivity,
  SteamIntegration,
  UpcomingReleases,
} from "@/features/dashboard/components";
import { FeatureCard } from "@/features/landing";
import { SignIn } from "@/features/sign-in";
import { Header } from "@/shared/components/header";
import {
  Body,
  Display,
  ResponsiveHeading,
  Subheading,
} from "@/shared/components/typography";

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Hero Section */}
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -right-40 -top-40 h-80 w-80 animate-pulse rounded-full bg-gradient-to-br from-primary/20 via-emerald-500/10 to-transparent blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 h-80 w-80 animate-pulse rounded-full bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-transparent blur-3xl delay-1000"></div>
          </div>

          <div className="relative z-10 mx-auto max-w-4xl space-y-8 text-center">
            <div className="space-y-4">
              <Display size="2xl" className="sm:text-display-2xl">
                <span className="animate-gradient bg-300% bg-pos-0 bg-gradient-to-r from-primary via-emerald-500 to-primary bg-clip-text text-transparent">
                  PlayLater
                </span>
              </Display>
              <Subheading
                size="lg"
                className="mx-auto max-w-3xl leading-relaxed"
              >
                Your ultimate game backlog companion. Track progress, organize
                collections, and never lose sight of your next gaming adventure.
              </Subheading>
            </div>

            <div className="align-center flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
              <SignIn variant="start" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>Free to use • No credit card required</span>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ArrowDown className="h-6 w-6 text-muted-foreground" />
          </div>
        </section>

        {/* Features Section */}
        <section className="relative px-4 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 space-y-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <TrendingUp className="h-4 w-4" />
                Features that work today
              </div>
              <ResponsiveHeading level={2} className="text-center">
                Everything you need to manage your gaming life
              </ResponsiveHeading>
              <Subheading className="mx-auto max-w-2xl">
                Built-in tools to help you stay organized and make the most of
                your gaming time, available right now.
              </Subheading>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Gamepad2 className="h-8 w-8 text-primary" />}
                title="Smart Collection Management"
                description="Track your games across multiple platforms. Organize by status: backlog, playing, completed, or wishlisted. Add acquisition types and platforms."
              />
              <FeatureCard
                icon={<Heart className="h-8 w-8 text-pink-500" />}
                title="Wishlist & Release Tracking"
                description="Build your wishlist and get notified about upcoming releases. Share your wishlist with friends and family via unique shareable links."
              />
              <FeatureCard
                icon={<BarChart3 className="h-8 w-8 text-purple-500" />}
                title="Personal Analytics Dashboard"
                description="Track completion rates, platform breakdowns, and collection statistics. See your recent activity and gaming milestones at a glance."
              />
              <FeatureCard
                icon={<MessageSquare className="h-8 w-8 text-blue-500" />}
                title="Game Reviews & Ratings"
                description="Rate and review games you've played. Share your thoughts with a 10-point rating system and detailed reviews visible to other users."
              />
              <FeatureCard
                icon={<Calendar className="h-8 w-8 text-emerald-500" />}
                title="IGDB Game Database"
                description="Access comprehensive game information powered by IGDB. Rich metadata, release dates, screenshots, and detailed game information."
              />
              <FeatureCard
                icon={<Share2 className="h-8 w-8 text-orange-500" />}
                title="Social Sharing Features"
                description="Share your wishlist publicly with friends and family. Perfect for gift ideas, game recommendations, and discovering new titles together."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative px-4 py-24">
          <div className="mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-emerald-500/10 to-primary/10 p-12 text-center backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
              <div className="relative space-y-6">
                <ResponsiveHeading level={2} className="text-center">
                  Stop losing track of great games
                </ResponsiveHeading>
                <Body size="lg" variant="muted" className="mx-auto max-w-2xl">
                  Take control of your gaming backlog today. Track what you own,
                  discover what&apos;s coming next, and never forget about that
                  perfect game again.
                </Body>
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <SignIn variant="default" />
                  <Body size="sm" variant="muted">
                    Start organizing in under 30 seconds
                  </Body>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/40 px-4 py-12">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-6 w-6 text-primary" />
                <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-lg font-semibold text-transparent">
                  PlayLater
                </span>
              </div>
              <Body size="sm" variant="muted">
                © {new Date().getFullYear()} PlayLater. Built for gamers, by
                gamers.
              </Body>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <>
      <Header />
      <section className="container mt-2 pt-16">
        <ResponsiveHeading
          level={1}
          className="md:text-heading-lg xl:text-heading-xl"
        >
          Hi, {session.user.name}
        </ResponsiveHeading>

        {/* Main dashboard grid - adaptive layout */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {/* Primary widgets - always visible */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Suspense fallback={"Loading..."}>
              <CurrentlyPlaying />
            </Suspense>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <Suspense fallback={"Loading..."}>
              <UpcomingReleases />
            </Suspense>
          </div>

          {/* Stats widgets */}
          <Suspense fallback={"Loading..."}>
            <BacklogCount />
          </Suspense>

          <Suspense fallback={"Loading..."}>
            <CollectionStats />
          </Suspense>

          {/* Additional adaptive widgets */}
          <div className="xl:col-span-1">
            <Suspense fallback={"Loading..."}>
              <RecentActivity />
            </Suspense>
          </div>

          <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1">
            <Suspense fallback={"Loading..."}>
              <PlatformBreakdown />
            </Suspense>
          </div>

          <Suspense fallback={"Loading..."}>
            <SteamIntegration />
          </Suspense>
        </section>
      </section>
    </>
  );
}
