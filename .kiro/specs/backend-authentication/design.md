# Design Document

## Overview

The Backend Authentication System is a secure, production-ready authentication layer built with Express.js, Prisma ORM, and PostgreSQL. It provides JWT-based stateless authentication, bcrypt password hashing, rate limiting, and comprehensive audit logging. The system integrates seamlessly with the existing database schema and supports the Arabic RTL frontend login interface. The design emphasizes security best practices, scalability, and maintainability while providing clear error messages in Arabic for end users.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│                  http://localhost:5173                       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/HTTPS
                         │ CORS Enabled
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Express.js Backend API                      │
│                  http://localhost:4000                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Middleware Layer                         │  │
│  │  • CORS Handler                                       │  │
│  │  • Request Logger                                     │  │
│  │  • Rate Limiter (Login endpoint)                     │  │
│  │  • Auth Middleware (Protected routes)                │  │
│  │  • Error Handler                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Route Handlers                           │  │
│  │  • POST /api/auth/login                              │  │
│  │  • GET  /api/users/list                              │  │
│  │  • POST /api/auth/refresh (future)                   │  │
│  │  • POST /api/auth/logout (future)                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Service Layer                            │  │
│  │  • AuthService (login, token generation)             │  │
│  │  • UserService (fetch users, validate)               │  │
│  │  • PasswordService (hash, compare)                   │  │
│  │  • TokenService (generate, verify JWT)               │  │
│  │  • AuditService (log events)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Prisma Client                            │  │
│  │  • Type-safe database queries                         │  │
│  │  • Connection pooling                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (Supabase)                  │
│  • users table (with password hash)                          │
│  • branches table                                            │
│  • event_log table                                           │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

**Login Flow:**

1. Client sends POST /api/auth/login with {userId, password}
2. Rate limiter checks attempt count for IP
3. AuthService validates userId exists and is active
4. PasswordService compares password with stored hash
5. TokenService generates JWT with user claims
6. AuditService logs successful login event
7. Response returns {success: true, token, user}

**Protected Route Flow:**

1. Client sends request with Authorization: Bearer <token>
2. Auth middleware extracts and verifies JWT
3. Middleware attaches decoded user to req.user
4. Route handler processes request with authenticated user context
5. Response returns requested data

## Components and Interfaces

### 1. Database Schema Updates

**Updated User Model:**

```prisma
model User {
  id                Int               @id @default(autoincrement())
  username          String            @unique @db.VarChar(50)
  passwordHash      String            @db.VarChar(255)  // NEW FIELD
  fullName          String            @db.VarChar(100)
  email             String?           @db.VarChar(100)
  role              String            @db.VarChar(20)   // SELLER, MANAGER, ADMIN
  branchId          Int?
  isActive          Boolean           @default(true)
  lastLoginAt       DateTime?         // NEW FIELD
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  branch            Branch?           @relation(fields: [branchId], references: [id])
  // ... existing relations
}
```

### 2. TypeScript Interfaces

**File:** `backend/src/types/auth.types.ts`

```typescript
// Request/Response Types
export interface LoginRequest {
  userId: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: number;
    fullName: string;
    role: 'SELLER' | 'MANAGER' | 'ADMIN';
    branch: string;
  };
}

export interface UserListResponse {
  success: boolean;
  users: UserListItem[];
}

export interface UserListItem {
  id: string;
  fullName: string;
  branchName: string;
  isActive: boolean;
}

// JWT Payload
export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
  branchId: number | null;
  iat: number; // Issued at
  exp: number; // Expiration
}

// Error Response
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// Express Request with User
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}
```

### 3. Service Layer

#### PasswordService

**File:** `backend/src/services/passwordService.ts`

```typescript
import bcrypt from 'bcrypt';

class PasswordService {
  private readonly SALT_ROUNDS = 10;

  async hashPassword(plainPassword: string): Promise<string>;
  async comparePassword(plainPassword: string, hash: string): Promise<boolean>;
  validatePasswordStrength(password: string): { valid: boolean; message?: string };
}
```

**Methods:**

- `hashPassword()` - Generates bcrypt hash with 10 salt rounds
- `comparePassword()` - Verifies password against hash
- `validatePasswordStrength()` - Checks password meets minimum requirements (8+ chars)

#### TokenService

**File:** `backend/src/services/tokenService.ts`

```typescript
import jwt from 'jsonwebtoken';

class TokenService {
  private readonly SECRET_KEY = process.env.JWT_SECRET!;
  private readonly EXPIRATION = '8h';

  generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string;
  verifyToken(token: string): JWTPayload | null;
  decodeToken(token: string): JWTPayload | null;
}
```

**Methods:**

- `generateToken()` - Creates signed JWT with 8-hour expiration
- `verifyToken()` - Validates token signature and expiration
- `decodeToken()` - Decodes token without verification (for debugging)

#### AuthService

**File:** `backend/src/services/authService.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import PasswordService from './passwordService';
import TokenService from './tokenService';
import AuditService from './auditService';

class AuthService {
  constructor(
    private prisma: PrismaClient,
    private passwordService: PasswordService,
    private tokenService: TokenService,
    private auditService: AuditService
  ) {}

  async login(userId: string, password: string, ipAddress: string): Promise<LoginResponse>;
  async validateUser(userId: string): Promise<User | null>;
}
```

**Methods:**

- `login()` - Main authentication logic
  1. Fetch user by ID with branch relation
  2. Check if user exists and is active
  3. Verify password hash
  4. Generate JWT token
  5. Update lastLoginAt timestamp
  6. Log successful login event
  7. Return token and user info

- `validateUser()` - Checks if user exists and is active

#### UserService

**File:** `backend/src/services/userService.ts`

```typescript
import { PrismaClient } from '@prisma/client';

class UserService {
  constructor(private prisma: PrismaClient) {}

  async getActiveUsers(): Promise<UserListItem[]>;
  async getUserById(id: number): Promise<User | null>;
  async updateLastLogin(userId: number): Promise<void>;
}
```

**Methods:**

- `getActiveUsers()` - Fetches all active users with branch names
- `getUserById()` - Retrieves single user by ID
- `updateLastLogin()` - Updates lastLoginAt timestamp

#### AuditService

**File:** `backend/src/services/auditService.ts`

```typescript
import { PrismaClient } from '@prisma/client';

class AuditService {
  constructor(private prisma: PrismaClient) {}

  async logEvent(
    eventType: string,
    userId: number | null,
    eventData: Record<string, any>
  ): Promise<void>;
}
```

**Methods:**

- `logEvent()` - Creates EventLog entry with sanitized data

### 4. Middleware

#### Auth Middleware

**File:** `backend/src/middleware/authMiddleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import TokenService from '../services/tokenService';

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Extract token from Authorization header
  // Verify token using TokenService
  // Attach decoded user to req.user
  // Call next() or return 401 error
};
```

#### Rate Limiter Middleware

**File:** `backend/src/middleware/rateLimiter.ts`

```typescript
import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة بعد 15 دقيقة',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 5. Route Handlers

#### Auth Routes

**File:** `backend/src/routes/auth.routes.ts`

```typescript
import express from 'express';
import AuthController from '../controllers/authController';
import { loginRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// POST /api/auth/login - Login endpoint with rate limiting
router.post('/login', loginRateLimiter, AuthController.login);

export default router;
```

#### User Routes

**File:** `backend/src/routes/user.routes.ts`

```typescript
import express from 'express';
import UserController from '../controllers/userController';

const router = express.Router();

// GET /api/users/list - Public endpoint (no auth required)
router.get('/list', UserController.getActiveUsers);

export default router;
```

### 6. Controllers

#### AuthController

**File:** `backend/src/controllers/authController.ts`

```typescript
import { Request, Response } from 'express';
import AuthService from '../services/authService';

class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { userId, password } = req.body;

      // Validation
      if (!userId || !password) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'يرجى إدخال اسم المستخدم وكلمة المرور',
          },
        });
        return;
      }

      // Get IP address
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

      // Authenticate
      const result = await authService.login(userId, password, ipAddress);

      res.status(200).json(result);
    } catch (error) {
      // Error handling with Arabic messages
      if (error.code === 'INVALID_CREDENTIALS') {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'اسم المستخدم أو كلمة المرور غير صحيحة',
          },
        });
      } else if (error.code === 'ACCOUNT_DISABLED') {
        res.status(403).json({
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'تم تعطيل هذا الحساب. يرجى التواصل مع المسؤول',
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
          },
        });
      }
    }
  }
}

export default new AuthController();
```

#### UserController

**File:** `backend/src/controllers/userController.ts`

```typescript
import { Request, Response } from 'express';
import UserService from '../services/userService';

class UserController {
  async getActiveUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.getActiveUsers();

      res.status(200).json({
        success: true,
        users,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'خطأ في تحميل قائمة المستخدمين',
        },
      });
    }
  }
}

export default new UserController();
```

## Data Models

### User Model (Updated)

```typescript
interface User {
  id: number;
  username: string;
  passwordHash: string; // bcrypt hash
  fullName: string;
  email: string | null;
  role: 'SELLER' | 'MANAGER' | 'ADMIN';
  branchId: number | null;
  isActive: boolean;
  lastLoginAt: Date | null; // Track last successful login
  createdAt: Date;
  updatedAt: Date;
  branch?: Branch; // Relation
}
```

### EventLog Model (Existing)

```typescript
interface EventLog {
  id: number;
  eventType: string; // USER_LOGIN, LOGIN_FAILED, LOGIN_DISABLED_ACCOUNT
  userId: number | null;
  eventData: any; // JSON: {ipAddress, userAgent, timestamp}
  createdAt: Date;
}
```

## Error Handling

### Error Codes and Messages

```typescript
const ERROR_MESSAGES = {
  // Authentication Errors
  INVALID_CREDENTIALS: {
    status: 401,
    message: 'اسم المستخدم أو كلمة المرور غير صحيحة',
  },
  ACCOUNT_DISABLED: {
    status: 403,
    message: 'تم تعطيل هذا الحساب. يرجى التواصل مع المسؤول',
  },

  // Token Errors
  NO_TOKEN: {
    status: 401,
    message: 'لم يتم توفير رمز المصادقة',
  },
  INVALID_TOKEN: {
    status: 401,
    message: 'رمز المصادقة غير صالح',
  },
  TOKEN_EXPIRED: {
    status: 401,
    message: 'انتهت صلاحية رمز المصادقة. يرجى تسجيل الدخول مرة أخرى',
  },

  // Validation Errors
  MISSING_FIELDS: {
    status: 400,
    message: 'يرجى إدخال جميع الحقول المطلوبة',
  },

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: {
    status: 429,
    message: 'تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة بعد 15 دقيقة',
  },

  // Server Errors
  SERVER_ERROR: {
    status: 500,
    message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
  },
  DATABASE_ERROR: {
    status: 500,
    message: 'خطأ في قاعدة البيانات',
  },
};
```

### Error Handler Middleware

**File:** `backend/src/middleware/errorHandler.ts`

```typescript
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  // Handle known error types
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: ERROR_MESSAGES.INVALID_TOKEN.message,
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: ERROR_MESSAGES.TOKEN_EXPIRED.message,
      },
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: ERROR_MESSAGES.SERVER_ERROR.message,
    },
  });
};
```

## Security Considerations

### 1. Password Security

- **Bcrypt hashing** with 10 salt rounds (industry standard)
- **Never log passwords** in any form
- **Validate password strength** (minimum 8 characters)
- **No password in responses** or error messages

### 2. JWT Token Security

- **Secret key** stored in environment variable (never in code)
- **8-hour expiration** to limit token lifetime
- **Signed tokens** to prevent tampering
- **HTTPS only** in production (enforce via middleware)

### 3. Rate Limiting

- **5 attempts per 15 minutes** per IP address
- **Prevents brute force attacks**
- **Logs all failed attempts** for monitoring

### 4. CORS Configuration

- **Whitelist specific origins** (no wildcard in production)
- **Credentials support** for cookie-based auth (future)
- **Preflight caching** for performance

### 5. Input Validation

- **Sanitize all inputs** to prevent SQL injection (Prisma handles this)
- **Validate data types** before processing
- **Limit request body size** to prevent DoS

### 6. Audit Logging

- **Log all authentication events** (success and failure)
- **Include IP address and timestamp**
- **Never log sensitive data** (passwords, tokens)
- **Retention policy** for compliance

## Testing Strategy

### Unit Tests

**Password Service Tests:**

- Hash password generates valid bcrypt hash
- Compare password returns true for correct password
- Compare password returns false for incorrect password
- Password strength validation works correctly

**Token Service Tests:**

- Generate token creates valid JWT
- Verify token validates correct token
- Verify token rejects expired token
- Verify token rejects invalid signature

**Auth Service Tests:**

- Login succeeds with valid credentials
- Login fails with invalid password
- Login fails with inactive user
- Login updates lastLoginAt timestamp

### Integration Tests

**Login Endpoint Tests:**

- POST /api/auth/login with valid credentials returns 200 and token
- POST /api/auth/login with invalid password returns 401
- POST /api/auth/login with inactive user returns 403
- POST /api/auth/login with missing fields returns 400
- POST /api/auth/login respects rate limiting (6th attempt fails)

**User List Endpoint Tests:**

- GET /api/users/list returns all active users
- GET /api/users/list includes branch names
- GET /api/users/list excludes inactive users
- GET /api/users/list returns empty array when no users

**Auth Middleware Tests:**

- Protected route with valid token succeeds
- Protected route with no token returns 401
- Protected route with expired token returns 401
- Protected route with invalid token returns 401

### E2E Tests

1. Complete login flow: fetch users → login → access protected route
2. Rate limiting: 5 failed attempts → 6th attempt blocked
3. Token expiration: login → wait 8 hours → token rejected
4. Audit logging: login events recorded in database

## Performance Optimization

### 1. Database Queries

- **Use Prisma select** to fetch only needed fields
- **Include relations** in single query (avoid N+1)
- **Index on username** for fast user lookup
- **Connection pooling** via Prisma

### 2. Password Hashing

- **Async bcrypt** to avoid blocking event loop
- **Optimal salt rounds** (10 = ~100ms per hash)

### 3. JWT Tokens

- **Stateless authentication** (no database lookup per request)
- **Short expiration** (8 hours) to limit token lifetime
- **Refresh tokens** (future enhancement)

### 4. Rate Limiting

- **In-memory store** for development (express-rate-limit)
- **Redis store** for production (distributed rate limiting)

## Deployment Considerations

### Environment Variables

```env
# JWT Configuration
JWT_SECRET=<strong-random-secret-256-bits>
JWT_EXPIRATION=8h

# Database (already configured)
DATABASE_URL=postgresql://...

# Server
PORT=4000
NODE_ENV=production

# CORS
FRONTEND_URL=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_ATTEMPTS=5
```

### Production Checklist

- [ ] Generate strong JWT_SECRET (256-bit random string)
- [ ] Enable HTTPS only (no HTTP in production)
- [ ] Configure CORS with production frontend URL
- [ ] Set up Redis for distributed rate limiting
- [ ] Enable request logging to file/service
- [ ] Set up monitoring for failed login attempts
- [ ] Configure database connection pooling
- [ ] Enable Prisma query logging in production
- [ ] Set up automated backups for event_log table
- [ ] Document password reset procedure

### Migration Strategy

1. **Add password fields** to existing users table
2. **Run migration** via Prisma migrate
3. **Seed initial passwords** for existing users
4. **Test authentication** in staging environment
5. **Deploy to production** with zero downtime
6. **Monitor logs** for authentication errors
7. **Provide password reset** for users who need it
