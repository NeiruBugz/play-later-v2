import { auth } from "@/auth";
import { ArrowRight, Gamepad2 } from "lucide-react/";

import { Dashboard } from "@/features/dashboard/components/dashboard";
import { SignIn } from "@/features/sign-in";
import { EditorialHeader } from "@/shared/components/header";
import { Heading } from "@/shared/components/typography";

export default async function Page() {
  const session = await auth();

  if (session?.user == null) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gamepad2 className="size-6 text-primary" />
              <span className="text-lg font-semibold">PlayLater</span>
            </div>
            <SignIn />
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex flex-1 items-center">
          <section className="container py-24 sm:py-32">
            <div className="mx-auto max-w-4xl space-y-6 text-center">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Track Your Games, Master Your Backlog.
              </h1>
              <p className="mx-auto max-w-2xl text-muted-foreground md:text-xl">
                PlayLater is the ultimate companion for gamers. Organize your
                collection, track your progress, and discover your next favorite
                game.
              </p>
              <div className="flex items-center justify-center gap-4">
                <SignIn />
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 text-lg font-medium"
                >
                  Learn More <ArrowRight className="size-4" />
                </a>
              </div>
            </div>
          </section>
        </main>

        {/* Features Section */}
        <section id="features" className="bg-muted/50 py-24 sm:py-32">
          <div className="container">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Everything a Gamer Needs
              </h2>
              <p className="mt-4 text-muted-foreground md:text-lg">
                All the essential tools to manage your gaming life, beautifully
                designed and easy to use.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-2 text-xl font-semibold">
                  Smart Collections
                </h3>
                <p className="text-muted-foreground">
                  Organize your games by status—backlog, playing, completed, or
                  wishlisted. See your entire library at a glance.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-2 text-xl font-semibold">
                  Personal Dashboard
                </h3>
                <p className="text-muted-foreground">
                  Get insights into your gaming habits with stats on completion
                  rates, platform breakdowns, and recent activity.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-2 text-xl font-semibold">IGDB Integration</h3>
                <p className="text-muted-foreground">
                  Access a massive database of games for rich metadata, artwork,
                  and release dates, all automatically fetched.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container py-8">
          <div className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} PlayLater. Built for gamers, by
            gamers.
          </div>
        </footer>
      </div>
    );
  }

  return (
    <>
      <EditorialHeader authorized />
      <section className="container mt-2 pt-16">
        <Heading level={1} size="3xl">
          Hi, {session.user.name}
        </Heading>
        <Dashboard />
      </section>
    </>
  );
}
