import dotenv from 'dotenv';

// Load environment variables first, before any other imports
dotenv.config();

import app from './index';
import prisma from './prismaClient';
import websocketService from './services/websocket.service';

const PORT = process.env.PORT || 4000;

// Warm up database connection before starting server
async function warmupDatabase() {
  try {
    console.log('Warming up database connection...');
    await prisma.$connect();
    // Test query to ensure connection is ready
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection ready');
  } catch (error) {
    console.error('Database warmup failed:', error);
    // Continue anyway - let individual requests handle connection errors
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


