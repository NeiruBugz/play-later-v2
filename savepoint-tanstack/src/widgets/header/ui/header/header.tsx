import { Link } from "@tanstack/react-router";

import { ThemeToggle } from "@/features/toggle-theme";

export function Header() {
  return (
    <header className="bg-background/60 border-border/10 py-lg md:py-xl sticky top-0 z-50 backdrop-blur-2xl">
      <div className="container mx-auto flex items-center justify-between">
        <h1 className="text-h3 md:text-h1 tracking-tight">
          <Link
            href="/dashboard"
            className="gap-md md:gap-lg flex items-center"
            to={"."}
          >
            <img
              src="/logo.svg"
              alt=""
              aria-hidden="true"
              width={40}
              height={40}
              className="y2k-logo-glow h-8 w-8 md:h-10 md:w-10"
            />
            <span>SavePoint</span>
          </Link>
        </h1>
        <nav className="flex items-center">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
