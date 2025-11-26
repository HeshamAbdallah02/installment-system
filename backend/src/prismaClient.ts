import { PrismaClient, Prisma } from '@prisma/client';

// Create Prisma client with extended connection timeout
const prismaClient = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add connection timeout configuration
  // This helps with slow DNS resolution and network issues
  __internal: {
    engine: {
      connectTimeout: 30000, // 30 seconds instead of default 5s
    },
  },
} as unknown as Prisma.PrismaClientOptions);

// Handle connection errors gracefully
prismaClient.$connect().catch((error) => {
  console.error('Failed to connect to database:', error);
});

// Prevent connection from being closed prematurely
process.on('beforeExit', async () => {
  await prismaClient.$disconnect();
});

// Export the client directly
// Note: Retry logic should be implemented at the service layer for better control
export default prismaClient;
