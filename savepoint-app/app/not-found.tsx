import { ArrowLeft, Compass } from "lucide-react";
import Link from "next/link";

import { BrowserBackButton } from "@/shared/components/browser-back-button";
import { Button } from "@/shared/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div className="from-background via-background to-muted pointer-events-none absolute inset-0 bg-linear-to-br opacity-60" />
      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <span className="bg-secondary/20 text-secondary inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
          <Compass className="h-4 w-4" aria-hidden="true" />
          Lost in the library
        </span>
        <h1 className="font-serif text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          This save point doesn&apos;t exist.
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          The page you&apos;re looking for might have been removed, renamed, or
          is temporarily unavailable. Let&apos;s guide you back to familiar
          territory.
        </p>
        <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-center">
          <BrowserBackButton />
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Head back home
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          Still stuck?{" "}
          <Link
            href="/login"
            className="text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>{" "}
          to continue exploring your collection.
        </p>
      </div>
    </main>
  );
}
