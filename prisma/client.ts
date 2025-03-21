import { env } from '@/env.mjs';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaFactory = () => {
  // Add timeout parameters to the connection URL
  const url = new URL(env.POSTGRES_PRISMA_URL);
  url.searchParams.set('connect_timeout', '20');
  url.searchParams.set('pool_timeout', '20');

  const prisma = new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'stdout',
        level: 'error',
      },
      {
        emit: 'stdout',
        level: 'info',
      },
      {
        emit: 'stdout',
        level: 'warn',
      },
    ],
    datasources: {
      db: {
        url: url.toString(),
      },
    },
  });

  // prisma.$on("query", (e) => {
  //   console.log("Query: " + e.query);
  //   console.log("Params: " + e.params);
  //   console.log("Duration: " + e.duration + "ms");
  // });

  return prisma as PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? prismaFactory();

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
