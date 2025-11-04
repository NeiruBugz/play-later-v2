import { auth } from "@/auth";
import { BookOpen, Clock, Heart, Library, Sparkles, Users } from "lucide-react";
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
          <nav className="container mx-auto flex items-center justify-between px-4 py-6">
            <div className="flex items-center gap-2">
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <BookOpen className="text-primary-foreground h-5 w-5" />
              </div>
              <span className="text-foreground font-serif text-xl font-semibold">
                SavePoint
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Features
              </a>
              <a
                href="#philosophy"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Philosophy
              </a>
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Get Started
              </Button>
            </div>
          </nav>

          <div className="container mx-auto px-4 py-24 md:py-32">
            <div className="mx-auto max-w-4xl space-y-8 text-center">
              <div className="inline-block">
                <span className="bg-secondary/10 text-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  For Patient Gamers
                </span>
              </div>

              <h1 className="font-serif text-5xl leading-tight font-bold text-balance md:text-7xl">
                Your Personal Gaming Library & Journal
              </h1>

              <p className="text-muted-foreground mx-auto max-w-2xl text-xl leading-relaxed text-pretty md:text-2xl">
                Curate your collection and journal your experiences. Games are
                not chores to complete—they're worlds to explore and remember.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
                  asChild
                >
                  <Link href="/login">Start Your Journey</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent px-8"
                >
                  Learn More
                </Button>
              </div>

              <p className="text-muted-foreground text-sm">
                Free to start • No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="philosophy" className="bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="font-serif text-4xl font-bold text-balance md:text-5xl">
              A Different Approach to Gaming
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed text-pretty">
              Your game collection isn't a backlog—it's a library of
              opportunities. SavePoint helps you be intentional about your
              gaming journey, preserving memories and reflections along the way.
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 space-y-4 text-center">
            <h2 className="font-serif text-4xl font-bold md:text-5xl">
              Everything You Need
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Thoughtfully designed features for patient gamers
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border bg-card space-y-4 p-8 transition-shadow hover:shadow-lg">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Library className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-semibold">
                Personal Library
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Curate your collection across all platforms. Import from Steam
                and other services, or add games manually.
              </p>
            </Card>

            <Card className="border-border bg-card space-y-4 p-8 transition-shadow hover:shadow-lg">
              <div className="bg-secondary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <BookOpen className="text-secondary h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-semibold">
                Gaming Journal
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Write reflections and preserve memories. Capture what made each
                game special to you.
              </p>
            </Card>

            <Card className="border-border bg-card space-y-4 p-8 transition-shadow hover:shadow-lg">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Clock className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-semibold">
                Journey Tracking
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Mark where you are: Curious About, Currently Exploring,
                Experienced. No pressure, just progress.
              </p>
            </Card>

            <Card className="border-border bg-card space-y-4 p-8 transition-shadow hover:shadow-lg">
              <div className="bg-secondary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Heart className="text-secondary h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-semibold">
                Curated Collections
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Create themed collections like "Cozy Winter Games" or "Games
                That Made Me Think."
              </p>
            </Card>

            <Card className="border-border bg-card space-y-4 p-8 transition-shadow hover:shadow-lg">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Sparkles className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-semibold">Discovery</h3>
              <p className="text-muted-foreground leading-relaxed">
                Find similar games through IGDB integration. Discover your next
                adventure thoughtfully.
              </p>
            </Card>

            <Card className="border-border bg-card space-y-4 p-8 transition-shadow hover:shadow-lg">
              <div className="bg-secondary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Users className="text-secondary h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-semibold">
                Community Reflections
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Read and share perspectives on games. Connect with fellow
                patient gamers.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div className="space-y-6">
                <h2 className="font-serif text-4xl font-bold text-balance md:text-5xl">
                  Your Gaming Memories Timeline
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  View your gaming journey chronologically. See how your tastes
                  evolved, revisit cherished memories, and reflect on the worlds
                  you've explored.
                </p>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Explore Timeline
                </Button>
              </div>
              <div className="from-primary/20 to-secondary/20 relative aspect-4/3 overflow-hidden rounded-lg bg-linear-to-br">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="space-y-2 text-center">
                    <BookOpen className="text-primary mx-auto h-16 w-16 opacity-50" />
                    <p className="text-muted-foreground text-sm">
                      Timeline Preview
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl space-y-8 text-center">
            <h2 className="font-serif text-4xl font-bold text-balance md:text-5xl">
              Ready to Start Your Journey?
            </h2>
            <p className="text-muted-foreground text-xl text-pretty">
              Join patient gamers who are building intentional, memorable gaming
              experiences.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
              >
                Create Your Library
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent px-8"
              >
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-border bg-muted/30 border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                  <BookOpen className="text-primary-foreground h-5 w-5" />
                </div>
                <span className="font-serif text-xl font-semibold">
                  SavePoint
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your personal gaming library and journal for patient gamers.
              </p>
            </div>
          </div>

          <div className="border-border text-muted-foreground mt-12 border-t pt-8 text-center text-sm">
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
