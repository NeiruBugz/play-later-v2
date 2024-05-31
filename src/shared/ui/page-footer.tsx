import Link from "next/link";

import { siteConfig } from "@/src/shared/config/site";

export function SiteFooter() {
  return (
    <footer className="container flex h-12 shrink-0 flex-col items-center justify-center bg-background">
      <div className="flex h-fit items-center gap-2">
        <p className="font-medium">Play Later {new Date().getFullYear()}</p>
        <Link
          className="hover:underline"
          href={siteConfig.links.discord}
          target="_blank"
        >
          Discord
        </Link>
        <Link className="hover:underline" href={siteConfig.links.roadmap}>
          Roadmap
        </Link>
        <Link className="hover:underline" href={"/privacy-policy"}>
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
