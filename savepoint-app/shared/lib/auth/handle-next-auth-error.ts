export function isNextAuthRedirect(error: unknown): boolean {
  return error instanceof Error && error.message === "NEXT_REDIRECT";
}

export function isAuthenticationError(error: unknown): boolean {
  return error instanceof Error && error.message !== "NEXT_REDIRECT";
}
