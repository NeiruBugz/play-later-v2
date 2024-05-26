import { env } from "@/env.mjs";
import { PrismaClient } from "@prisma/client";
import { withOptimize } from "@prisma/extension-optimize";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaFactory = () => {
  const prisma = new PrismaClient({
    log: [
      {
        emit: "event",
        level: "query",
      },
      {
        emit: "stdout",
        level: "error",
      },
      {
        emit: "stdout",
        level: "info",
      },
      {
        emit: "stdout",
        level: "warn",
      },
    ],
  });

  prisma.$on("query", (e) => {
    console.log("Query: " + e.query);
    console.log("Params: " + e.params);
    console.log("Duration: " + e.duration + "ms");
  });

  prisma.$extends(withOptimize());

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
