import { Link } from "@tanstack/react-router";

import type { ErrorBoundaryProps } from "./error-boundary.type";
import { resolveView } from "./error-boundary.utility";

export function ErrorBoundary({ error }: ErrorBoundaryProps) {
  const view = resolveView(error);

  return (
    <div role="alert">
      <h1>{view.title}</h1>
      <p>{view.description}</p>
      {view.showLoginLink ? <Link to="/login">Sign in</Link> : null}
      <Link to="/">Go home</Link>
    </div>
  );
}
