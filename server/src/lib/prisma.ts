import { PrismaClient } from '@prisma/client';

/**
 * Singleton instance of PrismaClient.
 * Prevents multiple client instantiations across hot-reloads and ensures
 * type-safe database access across all controllers and services.
 */
export const prisma = new PrismaClient();

export default prisma;
