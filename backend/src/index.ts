import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import exampleRouter from './routes/example';
import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

dotenv.config();

const app: Application = express();

// Middleware
// CORS configuration for authentication
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // Enable credentials (cookies, authorization headers)
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow Authorization header
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
    exposedHeaders: ['Authorization'], // Expose Authorization header to client
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use('/health', healthRouter);
app.use('/api', exampleRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);

// Error handler (must be last)
app.use(errorHandler);

export default app;
