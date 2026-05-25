import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const RETRYABLE_READ_ACTIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

function isTransientConnectionError(error: unknown) {
  const candidate = error as { code?: string; name?: string; message?: string };
  return (
    candidate?.code === "P1001" ||
    candidate?.name === "PrismaClientInitializationError" ||
    candidate?.message?.includes("Can't reach database server") === true
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const basePrisma = globalForPrisma.prisma ?? new PrismaClient();

basePrisma.$use(async (params, next) => {
  const maxRetries = Number(process.env.PRISMA_READ_RETRIES ?? 2);
  if (!RETRYABLE_READ_ACTIONS.has(params.action)) {
    return next(params);
  }

  let attempt = 0;
  while (true) {
    try {
      return await next(params);
    } catch (error) {
      if (!isTransientConnectionError(error) || attempt >= maxRetries) {
        throw error;
      }
      attempt += 1;
      await wait(250 * attempt);
    }
  }
});

export const prisma = basePrisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
