import { Link } from "@tanstack/react-router";

import { AppError } from "@/shared/lib/errors";

type ErrorBoundaryProps = {
  error: Error;
};

type ErrorView = {
  title: string;
  description: string;
  showLoginLink?: boolean;
};

function resolveView(error: Error): ErrorView {
  if (!(error instanceof AppError)) {
    return {
      title: "Unexpected error",
      description: "Something went wrong. Please try again later.",
    };
  }

  switch (error.code) {
    case "NOT_FOUND":
      return {
        title: "Not found",
        description: "The page or resource you requested does not exist.",
      };
    case "UNAUTHORIZED":
      return {
        title: "Sign in required",
        description: "You need to sign in to access this page.",
        showLoginLink: true,
      };
    case "CONFLICT":
    case "VALIDATION":
    case "UPSTREAM":
    default:
      return {
        title: "Something went wrong",
        description: "An error occurred. Please try again.",
      };
  }
}

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
