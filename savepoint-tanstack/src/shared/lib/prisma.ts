import { NotFoundError } from "@/shared/lib/errors";

import { Prisma } from "../../../shared/lib/prisma/client.ts";

export function mapP2025ToNotFound(
  error: unknown,
  message: string,
  meta?: Record<string, unknown>
): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    throw new NotFoundError(message, meta);
  }
  throw error;
}

/**
 * True when `error` is a P2002 whose violated constraint covers every given
 * field. Probes the whole `meta` blob because the legacy engine reports
 * `meta.target` while the Prisma 7 driver adapter nests the constraint under
 * `meta.driverAdapterError.cause.constraint` (`fields` or `index`).
 */
export function isUniqueViolationOn(
  error: unknown,
  fields: readonly string[]
): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return false;
  }
  const probe = JSON.stringify(error.meta ?? {}).toLowerCase();
  return fields.every((field) => probe.includes(field.toLowerCase()));
}
