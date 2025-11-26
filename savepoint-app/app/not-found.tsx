import { ArrowLeft, Compass } from "lucide-react";
import Link from "next/link";

import { BrowserBackButton } from "@/shared/components/browser-back-button";
import { Button } from "@/shared/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="px-lg py-5xl sm:px-2xl lg:px-3xl relative flex flex-1 items-center justify-center overflow-hidden">
      <div className="from-background via-background to-muted pointer-events-none absolute inset-0 bg-linear-to-br opacity-60" />
      <div className="gap-2xl relative z-10 mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="bg-secondary/20 text-secondary gap-md px-lg py-sm inline-flex items-center rounded-full text-sm font-medium">
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
        <div className="gap-lg flex w-full flex-col-reverse sm:flex-row sm:items-center sm:justify-center">
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
