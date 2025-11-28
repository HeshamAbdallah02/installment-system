import { PrismaClient, Prisma } from '@prisma/client';

// Append pool timeout parameters to DATABASE_URL if not already present
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL || '';
  // Add connection pool parameters for Supabase pooler
  if (baseUrl && !baseUrl.includes('pool_timeout')) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}connection_limit=5&pool_timeout=30`;
  }
  return baseUrl;
};

// Create Prisma client with extended connection timeout
const prismaClient = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
} as Prisma.PrismaClientOptions);

// Don't auto-connect on import - let server.ts handle warmup with retries
// This prevents the initial connection error on cold starts

// Prevent connection from being closed prematurely
process.on('beforeExit', async () => {
  await prismaClient.$disconnect();
});

// Export the client directly
// Note: Retry logic is implemented in server.ts warmupDatabase()
export default prismaClient;
