import Image from "next/image";
import Link from "next/link";

export function Header({ isAuthorised }: { isAuthorised: boolean }) {
  if (isAuthorised) {
    return (
      <header className="border-border container mx-auto border-b py-xl">
        <div className="flex items-center justify-between">
          <h1 className="heading-xl font-serif">
            <Link href="/dashboard" className="flex items-center gap-lg">
              <Image
                src="/logo.svg"
                alt="SavePoint Logo"
                width={40}
                height={40}
                className="h-10 w-10"
              />
              <span>SavePoint</span>
            </Link>
          </h1>
          <nav className="flex items-center gap-2xl">
            <Link
              href="/games/search"
              className="body-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Search
            </Link>
            <Link
              href="/dashboard"
              className="body-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/library"
              className="body-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Library
            </Link>
            <Link
              href="/profile"
              className="body-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Profile
            </Link>
          </nav>
        </div>
      </header>
    );
  }
  return (
    <header className="border-border container mx-auto border-b py-xl">
      <div className="flex items-center justify-between">
        <h1 className="heading-xl font-serif">
          <Link href="/dashboard" className="flex items-center gap-lg">
            <Image
              src="/logo.svg"
              alt="SavePoint Logo"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span>SavePoint</span>
          </Link>
        </h1>
        <nav className="flex items-center gap-2xl">
          <Link
            href="/games/search"
            className="body-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            Search
          </Link>
        </nav>
      </div>
    </header>
  );
}
