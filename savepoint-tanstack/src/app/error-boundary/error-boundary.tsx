import { Link } from "@tanstack/react-router";

import { PageHeader } from "@/shared/ui/page-header";

import type { ErrorBoundaryProps } from "./error-boundary.type";
import { resolveView } from "./error-boundary.utility";

export function ErrorBoundary({ error }: ErrorBoundaryProps) {
  const view = resolveView(error);

  return (
    <div role="alert">
      <PageHeader title={view.title} className="mb-0" />
      <p>{view.description}</p>
      {view.showLoginLink ? <Link to="/login">Sign in</Link> : null}
      <Link to="/">Go home</Link>
    </div>
  );
}
