import type { PrismaClient } from "../../shared/lib/prisma/client.ts";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  throw new Error(
    "Prisma client is not yet configured. Implement db.ts in Slice 3 with PrismaPg adapter."
  );
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
