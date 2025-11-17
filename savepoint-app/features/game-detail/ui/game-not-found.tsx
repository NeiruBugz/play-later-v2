"use client";

import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BrowserBackButton } from "@/shared/components/browser-back-button";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

type GameNotFoundProps = {
  initialQuery?: string;
};
export function GameNotFound({ initialQuery = "" }: GameNotFoundProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 3) {
      router.push(`/games/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br opacity-60" />
      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <span className="bg-secondary/20 text-secondary inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
          <Search className="h-4 w-4" aria-hidden="true" />
          Game not found
        </span>
        <h1 className="font-serif text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          This game doesn&apos;t exist in our database.
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          The game you&apos;re looking for might have been removed, the URL
          might be incorrect, or it doesn&apos;t exist in the IGDB database. Try
          searching for it below.
        </p>
        <form onSubmit={handleSearch} className="w-full space-y-4">
          <div className="flex gap-2">
            <Input
              type="search"
              placeholder="Search for games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search for games by name"
              className="h-12 flex-1 text-base"
              minLength={3}
            />
            <Button
              type="submit"
              size="lg"
              disabled={searchQuery.trim().length < 3}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search
            </Button>
          </div>
          {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
            <p className="text-muted-foreground text-left text-sm">
              Please enter at least 3 characters to search
            </p>
          )}
        </form>
        <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-center">
          <BrowserBackButton />
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <Link href="/games/search">Browse all games</Link>
          </Button>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Head back home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
