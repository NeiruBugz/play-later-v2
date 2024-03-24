import { env } from "@/env.mjs";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

type LogLevel = Array<"query" | "error" | "warn">;
const LOG_LEVEL: LogLevel =
  env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];
const prismaFactory = (log_level = LOG_LEVEL) => {
  const prisma = new PrismaClient({ log: log_level });

  return prisma.$extends({
    name: "soft-delete",
    query: {
      game: {
        async delete({ args }) {
          return prisma.game.update({
            ...args,
            data: { deletedAt: new Date() },
          });
        },
      },
    },
  }) as PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? prismaFactory();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
