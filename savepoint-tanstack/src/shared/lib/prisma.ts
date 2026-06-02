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
