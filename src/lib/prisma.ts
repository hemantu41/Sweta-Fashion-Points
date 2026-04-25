/**
 * Prisma Client singleton for Next.js
 *
 * In development, hot-reloading creates a new PrismaClient on every module
 * reload. The global singleton pattern prevents exhausting the connection pool.
 *
 * Required env vars (add to .env.local and Vercel dashboard):
 *   DATABASE_URL  = postgresql://postgres.REF:PASSWORD@pooler.supabase.com:6543/postgres
 *   DIRECT_URL    = postgresql://postgres.REF:PASSWORD@db.REF.supabase.co:5432/postgres
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'warn', 'error']
      : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
