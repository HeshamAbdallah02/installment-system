import { PrismaClient } from '@prisma/client';

// Create Prisma client with retry logic for connection issues
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Add middleware to retry failed queries due to connection issues
prisma.$use(async (params, next) => {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      return await next(params);
    } catch (error: any) {
      // Check if it's a connection error (P1001, P1002, P1008, P1017)
      const isConnectionError =
        error?.code === 'P1001' || // Can't reach database server
        error?.code === 'P1002' || // Database server timeout
        error?.code === 'P1008' || // Operations timed out
        error?.code === 'P1017'; // Server has closed the connection

      if (isConnectionError && retries < maxRetries - 1) {
        retries++;
        console.log(
          `Database connection error, retrying (${retries}/${maxRetries - 1})...`
        );
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 100));
        continue;
      }

      // If not a connection error or max retries reached, throw the error
      throw error;
    }
  }
});

// Handle connection errors gracefully
prisma.$connect().catch((error) => {
  console.error('Failed to connect to database:', error);
});

// Prevent connection from being closed prematurely
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
