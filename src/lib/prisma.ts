import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

console.log(process.env.DATABASE_URL);

const prismaClientOptions = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Remove the immediate connection call - let it connect lazily when needed
// Only attempt connection if we're not in build mode
if (process.env.NODE_ENV !== 'production' && typeof window === 'undefined') {
  // Optional: Add connection testing in development only
  prisma.$connect()
    .then(() => {
      console.log('Database connected successfully');
    })
    .catch((err) => {
      console.warn('Database connection failed (this is okay during build):', err.message);
    });
}