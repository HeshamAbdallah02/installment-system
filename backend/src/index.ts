import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import healthRouter from './routes/health';
import exampleRouter from './routes/example';
import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import dashboardRouter from './routes/dashboard.routes';
import customerRouter from './routes/customer.routes';
import installmentRouter from './routes/installment.routes';
import productRouter from './routes/product.routes';
import paymentRouter from './routes/payment.routes';
import reportRouter from './routes/report.routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

dotenv.config();

const app: Application = express();

// Middleware
// CORS configuration for authentication
// Dynamic CORS configuration to handle multiple frontend ports
const corsOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);

      // Check if the origin is in our allowed list
      if (corsOrigins.some((allowedOrigin) => origin.startsWith(allowedOrigin))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Enable credentials (cookies, authorization headers)
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires'], // Allow cache control headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
    exposedHeaders: ['Authorization', 'Cache-Control'], // Expose headers to client
    maxAge: 86400, // Cache preflight response for 24 hours
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/health', healthRouter);
app.use('/api', exampleRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/customers', customerRouter);
app.use('/api/installments', installmentRouter);
app.use('/api/products', productRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/reports', reportRouter);

// Error handler (must be last)
app.use(errorHandler);

export default app;
