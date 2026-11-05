import { Link } from "@tanstack/react-router";

import { buttonVariants } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export function NotFoundPage() {
  return (
    <div className="container mx-auto flex flex-col gap-2 px-4 py-12">
      <PageHeader title="Page not found" className="mb-0" />
      <p>We couldn&apos;t find a page at this URL.</p>
      <p>
        <Link to="/" className={buttonVariants({ variant: "outline" })}>
          Go home
        </Link>
      </p>
    </div>
  );
}
