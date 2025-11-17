import Link from "next/link";

export function Header({ isAuthorised }: { isAuthorised: boolean }) {
  if (isAuthorised) {
    return (
      <header className="border-border container mx-auto border-b py-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl font-bold">
            <Link href="/dashboard">SavePoint</Link>
          </h1>
          <nav className="flex items-center gap-6">
            <Link
              href="/games/search"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Search
            </Link>
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/library"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Library
            </Link>
            <Link
              href="/profile"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Profile
            </Link>
          </nav>
        </div>
      </header>
    );
  }
  return (
    <header className="border-border container mx-auto border-b py-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold">
          <Link href="/dashboard">SavePoint</Link>
        </h1>
        <nav className="flex items-center gap-6">
          <Link
            href="/games/search"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            Search
          </Link>
        </nav>
      </div>
    </header>
  );
}
