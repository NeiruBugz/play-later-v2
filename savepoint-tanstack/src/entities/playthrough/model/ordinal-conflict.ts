export function isOrdinalUniqueConflict(error: unknown): boolean {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    (error as { code: unknown }).code !== "P2002"
  ) {
    return false;
  }
  const meta = (error as { meta?: unknown }).meta;
  if (typeof meta !== "object" || meta === null || !("target" in meta)) {
    return false;
  }
  const target = (meta as { target: unknown }).target;
  return (
    Array.isArray(target) &&
    (target as string[]).includes("ordinal") &&
    (target as string[]).includes("libraryItemId")
  );
}
