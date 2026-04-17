import { auth } from "@/auth";
import { BookOpen, Clock, Heart, Library, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";

export default async function Page() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="from-muted/30 to-background absolute inset-0 bg-linear-to-b" />
        <div className="relative">
          <nav className="px-lg py-2xl container mx-auto flex items-center justify-between">
            <div className="gap-md flex items-center">
              <Image
                src="/logo.svg"
                alt="SavePoint Logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="heading-sm text-foreground font-semibold">
                SavePoint
              </span>
            </div>
            <div className="gap-2xl hidden items-center md:flex">
              <a
                href="#features"
                className="body-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#philosophy"
                className="body-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Philosophy
              </a>
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                asChild
              >
                <Link href="/login">Get Started</Link>
              </Button>
            </div>
            <div className="flex items-center md:hidden">
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </nav>
          <div className="px-lg py-5xl container mx-auto md:py-32">
            <div className="space-y-3xl mx-auto max-w-4xl text-center">
              <div className="inline-block">
                <span className="body-sm bg-secondary/10 text-secondary gap-md px-lg py-md inline-flex items-center rounded-full font-medium">
                  <Sparkles className="h-4 w-4" />
                  For Patient Gamers
                </span>
              </div>
              <h1 className="display-2xl font-semibold text-balance">
                Your Personal Gaming Library & Journal
              </h1>
              <p className="body-lg text-muted-foreground mx-auto max-w-2xl text-pretty">
                Curate your collection and journal your experiences. Games are
                not chores to complete—they&apos;re worlds to explore and
                remember.
              </p>
              <div className="gap-xl pt-xl flex flex-col items-center justify-center sm:flex-row">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-3xl"
                  asChild
                >
                  <Link href="/login">Start Your Journey</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="px-3xl bg-transparent"
                  asChild
                >
                  <a href="#philosophy">Learn More</a>
                </Button>
              </div>
              <p className="body-sm text-muted-foreground">
                Free to start • No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>
      <section id="philosophy" className="bg-muted/30 py-5xl">
        <div className="px-lg container mx-auto">
          <div className="space-y-2xl mx-auto max-w-3xl text-center">
            <h2 className="display-lg font-semibold text-balance">
              A Different Approach to Gaming
            </h2>
            <p className="body-lg text-muted-foreground text-pretty">
              Your game collection isn&apos;t a backlog—it&apos;s a library of
              opportunities. SavePoint helps you be intentional about your
              gaming journey, preserving memories and reflections along the way.
            </p>
          </div>
        </div>
      </section>
      <section id="features" className="py-5xl">
        <div className="px-lg container mx-auto">
          <div className="mb-4xl space-y-xl text-center">
            <h2 className="display-lg font-semibold">Everything You Need</h2>
            <p className="body-lg text-muted-foreground mx-auto max-w-2xl">
              Thoughtfully designed features for patient gamers
            </p>
          </div>
          <div className="gap-3xl mx-auto grid max-w-6xl md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border bg-card space-y-xl p-3xl transition-shadow hover:shadow-lg">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Library className="text-primary h-6 w-6" />
              </div>
              <h3 className="heading-lg font-semibold">Personal Library</h3>
              <p className="body-md text-muted-foreground">
                Curate your collection across all platforms. Import from Steam
                and other services, or add games manually.
              </p>
            </Card>
            <Card className="border-border bg-card space-y-xl p-3xl transition-shadow hover:shadow-lg">
              <div className="bg-secondary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <BookOpen className="text-secondary h-6 w-6" />
              </div>
              <h3 className="heading-lg font-semibold">Gaming Journal</h3>
              <p className="body-md text-muted-foreground">
                Write reflections and preserve memories. Capture what made each
                game special to you.
              </p>
            </Card>
            <Card className="border-border bg-card space-y-xl p-3xl transition-shadow hover:shadow-lg">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Clock className="text-primary h-6 w-6" />
              </div>
              <h3 className="heading-lg font-semibold">Journey Tracking</h3>
              <p className="body-md text-muted-foreground">
                Mark where you are: Curious About, Currently Exploring,
                Experienced. No pressure, just progress.
              </p>
            </Card>
            <Card className="border-border bg-card space-y-xl p-3xl relative transition-shadow hover:shadow-lg">
              <div className="bg-secondary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Heart className="text-secondary h-6 w-6" />
              </div>
              <div className="gap-md flex items-center">
                <h3 className="heading-lg font-semibold">
                  Curated Collections
                </h3>
                <span className="body-sm bg-muted text-muted-foreground px-md rounded-full py-1 font-medium">
                  Coming soon
                </span>
              </div>
              <p className="body-md text-muted-foreground">
                Create themed collections like &ldquo;Cozy Winter Games&rdquo;
                or &ldquo;Games That Made Me Think.&rdquo;
              </p>
            </Card>
          </div>
        </div>
      </section>
      <section className="bg-muted/30 py-5xl">
        <div className="px-lg container mx-auto">
          <div className="mx-auto max-w-6xl">
            <div className="gap-4xl grid items-center md:grid-cols-2">
              <div className="space-y-2xl">
                <h2 className="display-lg font-semibold text-balance">
                  Your Gaming Memories Timeline
                </h2>
                <p className="body-lg text-muted-foreground">
                  View your gaming journey chronologically. See how your tastes
                  evolved, revisit cherished memories, and reflect on the worlds
                  you&apos;ve explored.
                </p>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  asChild
                >
                  <Link href="/login">Explore Timeline</Link>
                </Button>
              </div>
              <div className="from-primary/20 to-secondary/20 relative aspect-4/3 overflow-hidden rounded-lg bg-linear-to-br">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="space-y-md text-center">
                    <BookOpen className="text-primary mx-auto h-16 w-16 opacity-50" />
                    <p className="body-sm text-muted-foreground">
                      Timeline Preview
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-5xl">
        <div className="px-lg container mx-auto">
          <div className="space-y-3xl mx-auto max-w-3xl text-center">
            <h2 className="display-lg font-semibold text-balance">
              Ready to Start Your Journey?
            </h2>
            <p className="body-lg text-muted-foreground text-pretty">
              Join patient gamers who are building intentional, memorable gaming
              experiences.
            </p>
            <div className="gap-xl flex flex-col items-center justify-center sm:flex-row">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-3xl"
                asChild
              >
                <Link href="/login">Create Your Library</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-3xl bg-transparent"
                asChild
              >
                <Link href="/login">View Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      <footer className="border-border bg-muted/30 border-t">
        <div className="px-lg py-4xl container mx-auto">
          <div className="gap-3xl grid md:grid-cols-4">
            <div className="space-y-xl">
              <div className="gap-md flex items-center">
                <Image
                  src="/logo.svg"
                  alt="SavePoint Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <span className="heading-sm font-semibold">SavePoint</span>
              </div>
              <p className="body-sm text-muted-foreground">
                Your personal gaming library and journal for patient gamers.
              </p>
            </div>
          </div>
          <div className="body-sm border-border text-muted-foreground mt-4xl pt-3xl border-t text-center">
            <p>
              2025 SavePoint. For patient gamers who view games as worlds to
              explore.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
