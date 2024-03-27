import Link from "next/link";

import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="container z-40 flex h-12 shrink-0 flex-col items-center justify-center">
      <div className="flex h-fit items-center gap-2">
        <p className="font-medium">Play Later {new Date().getFullYear()}</p>
        <Link
          href={siteConfig.links.roadmap}
          target="_blank"
          className="hover:underline"
        >
          Roadmap
        </Link>
        <Link
          href={siteConfig.links.discord}
          target="_blank"
          className="hover:underline"
        >
          Discord
        </Link>
        <Link href="/privacy-policy" className="hover:underline">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
