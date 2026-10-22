import { PrismaClient } from '@prisma/client';

/**
 * Singleton instance of PrismaClient.
 * Uses globalThis caching to prevent exhausting connection pools across
 * serverless function invocations (e.g. Vercel) and hot-reloads.
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

