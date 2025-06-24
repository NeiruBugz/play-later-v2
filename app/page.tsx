import { auth } from "@/auth";
import { BacklogCount } from "@/features/dashboard/components/backlog-count";
import { CurrentlyPlaying } from "@/features/dashboard/components/currently-playing";
import { UpcomingReleases } from "@/features/dashboard/components/upcoming-releases";
import { FeatureCard } from "@/features/landing";
import { SignIn } from "@/features/sign-in";
import { Header } from "@/shared/components/header";
import {
  Body,
  Display,
  ResponsiveHeading,
} from "@/shared/components/typography";
import {
  BarChart3,
  Gamepad2,
  ListChecks,
  Share2,
  ComputerIcon as Steam,
} from "lucide-react";
import { Suspense } from "react";

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="min-h-screen text-white">
        <section className="relative flex h-screen items-center justify-center overflow-hidden">
          {/* <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-20"></div> */}
          <div className="relative z-10 space-y-6 px-4 text-center">
            <Display size="2xl" className="md:text-display-2xl">
              <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                PlayLater
              </span>
            </Display>
            <Body
              size="lg"
              className="md:text-body-lg mx-auto max-w-2xl text-gray-300"
            >
              Your ultimate game backlog companion. Track, wish, and conquer
              your gaming journey.
            </Body>
            <SignIn variant="start" />
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 transform animate-bounce">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </section>

        <section className="px-4 py-20">
          <ResponsiveHeading level={2} className="mb-12 text-center">
            Level Up Your Gaming Experience
          </ResponsiveHeading>
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Gamepad2 className="h-10 w-10 text-green-400" />}
              title="Track Your Collection"
              description="Keep tabs on your growing game library with ease. Never lose track of what you own or what you've conquered."
            />
            <FeatureCard
              icon={<ListChecks className="h-10 w-10 text-emerald-400" />}
              title="IGDB Integration"
              description="Access comprehensive game info powered by IGDB.com. Get detailed insights into your favorite titles."
            />
            <FeatureCard
              icon={<Share2 className="h-10 w-10 text-lime-400" />}
              title="Wishlist Sharing"
              description="Share your gaming wishlist with friends and family. Perfect for gift ideas or multiplayer planning."
            />
            <FeatureCard
              icon={<BarChart3 className="h-10 w-10 text-teal-400" />}
              title="User Stats"
              description="Dive deep into your gaming habits with detailed statistics. Track your progress and see how your tastes evolve."
            />
            <FeatureCard
              icon={<Steam className="h-10 w-10 text-green-300" />}
              title="Steam Import"
              description="Seamlessly import your Steam library. Get started quickly by syncing your existing collection."
            />
          </div>
        </section>

        <section className="px-4 py-20">
          <div className="mx-auto max-w-4xl space-y-8 text-center">
            <ResponsiveHeading level={2}>
              Ready to Conquer Your Backlog?
            </ResponsiveHeading>
            <Body size="lg" className="text-gray-300">
              Join to organize your collections, tracking progress, and
              discovering new adventures.
            </Body>
            <SignIn variant="default" />
          </div>
        </section>

        {/* Footer */}
        <footer className="px-4 py-8 text-center text-gray-400">
          <p>{new Date().getFullYear()} PlayLater</p>
        </footer>
      </div>
    );
  }

  return (
    <>
      <Header />
      <section className="container mt-2 pt-[60px]">
        <ResponsiveHeading
          level={1}
          className="md:text-heading-lg xl:text-heading-xl"
        >
          Hi, {session.user.name}
        </ResponsiveHeading>
        <section className="mt-2 flex max-w-[100vw] grid-cols-3 justify-between">
          <Suspense fallback={"Loading..."}>
            <UpcomingReleases />
          </Suspense>
          <Suspense fallback={"Loading..."}>
            <BacklogCount />
          </Suspense>
          <Suspense>
            <CurrentlyPlaying />
          </Suspense>
        </section>
      </section>
    </>
  );
}
