import { AppError } from "@/shared/lib/errors";

import type { ErrorView } from "./error-boundary.type";

export function resolveView(error: Error): ErrorView {
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
