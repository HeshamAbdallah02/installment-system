import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import exampleRouter from './routes/example';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

dotenv.config();

const app: Application = express();

// Middleware
app.use(
  cors({
    origin: process.env.VITE_API_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use('/health', healthRouter);
app.use('/api', exampleRouter);

// Error handler (must be last)
app.use(errorHandler);

export default app;
