import dotenv from 'dotenv';

// Load environment variables first, before any other imports
dotenv.config();

import app from './index';
import prisma from './prismaClient';
import websocketService from './services/websocket.service';

const PORT = process.env.PORT || 4000;

// Warm up database connection with retry logic
async function warmupDatabase() {
  const maxRetries = 5; // Increased from 3

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Warming up database connection (attempt ${attempt}/${maxRetries})...`);
      await prisma.$connect();
      // Test query to ensure connection is ready
      await prisma.$queryRaw`SELECT 1`;
      console.log('✓ Database connection ready');
      return; // Success, exit function
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Database warmup attempt ${attempt} failed:`, errorMessage);

      if (attempt < maxRetries) {
        const waitTime = attempt * 2000; // 2s, 4s, 6s, 8s - increased delays
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        console.error(
          '⚠ Database warmup failed after all retries. Server will start but initial requests may fail.'
        );
      }
    }
  }
}

// Start server after database warmup
warmupDatabase().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Initialize WebSocket server
  websocketService.initialize(server);

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    console.log(`${signal} signal received: closing HTTP server`);
    server.close(async () => {
      console.log('HTTP server closed');
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
});
