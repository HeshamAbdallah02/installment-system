# Implementation Plan

- [x] 1. Update database schema and run migrations
  - [x] 1.1 Add password fields to User model in Prisma schema
    - Add passwordHash field (String, @db.VarChar(255))
    - Add lastLoginAt field (DateTime?, optional)
    - Update Prisma schema file
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Create and apply database migration
    - Run `npx prisma migrate dev --name add_user_password`
    - Verify migration applied successfully in Supabase
    - Generate updated Prisma Client
    - _Requirements: 1.1_

- [x] 2. Install required dependencies
  - Install bcrypt for password hashing: `npm install bcrypt @types/bcrypt`
  - Install jsonwebtoken for JWT: `npm install jsonwebtoken @types/jsonwebtoken`
  - Install express-rate-limit: `npm install express-rate-limit`
  - Install cors: `npm install cors @types/cors`
  - _Requirements: 1.1, 2.2, 5.1, 6.1_

- [x] 3. Create TypeScript type definitions
  - [x] 3.1 Create auth types file
    - Define LoginRequest, LoginResponse interfaces
    - Define UserListResponse, UserListItem interfaces
    - Define JWTPayload interface
    - Define ErrorResponse interface
    - Define AuthenticatedRequest extending Express Request
    - Export all types from backend/src/types/auth.types.ts
    - _Requirements: 2.1, 2.6, 3.4, 8.5_

- [x] 4. Implement service layer
  - [x] 4.1 Create PasswordService
    - Implement hashPassword() method using bcrypt with 10 salt rounds
    - Implement comparePassword() method for verification
    - Implement validatePasswordStrength() for basic validation
    - Add error handling for bcrypt operations
    - Create file: backend/src/services/passwordService.ts
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

  - [x] 4.2 Create TokenService
    - Implement generateToken() to create JWT with 8-hour expiration
    - Implement verifyToken() to validate JWT signature and expiration
    - Implement decodeToken() for debugging purposes
    - Use JWT_SECRET from environment variables
    - Create file: backend/src/services/tokenService.ts
    - _Requirements: 2.2, 2.3, 4.1, 4.2, 4.6_

  - [x] 4.3 Create UserService
    - Implement getActiveUsers() to fetch users where isActive = true
    - Include branch relation in query using Prisma include
    - Map results to UserListItem format with branch name
    - Implement getUserById() for single user lookup
    - Implement updateLastLogin() to update lastLoginAt timestamp
    - Create file: backend/src/services/userService.ts
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 4.4 Create AuditService
    - Implement logEvent() to create EventLog entries
    - Support event types: USER_LOGIN, LOGIN_FAILED, LOGIN_DISABLED_ACCOUNT
    - Store IP address and timestamp in eventData JSON field
    - Sanitize data to prevent logging sensitive information
    - Create file: backend/src/services/auditService.ts
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 4.5 Create AuthService
    - Implement login() method with full authentication logic
    - Validate user exists and isActive is true
    - Compare password using PasswordService
    - Generate JWT token using TokenService
    - Update lastLoginAt timestamp
    - Log authentication events using AuditService
    - Return LoginResponse with token and user info
    - Handle errors: INVALID_CREDENTIALS, ACCOUNT_DISABLED
    - Create file: backend/src/services/authService.ts
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 5. Implement middleware
  - [x] 5.1 Create authentication middleware
    - Extract JWT token from Authorization header (Bearer scheme)
    - Verify token using TokenService
    - Attach decoded user payload to req.user
    - Return 401 errors for missing, invalid, or expired tokens
    - Create file: backend/src/middleware/authMiddleware.ts
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 5.2 Create rate limiter middleware
    - Configure express-rate-limit for login endpoint
    - Set window to 15 minutes (900000ms)
    - Set max attempts to 5 per IP address
    - Return 429 status with Arabic error message when exceeded
    - Create file: backend/src/middleware/rateLimiter.ts
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 5.3 Update error handler middleware
    - Add handling for JWT errors (JsonWebTokenError, TokenExpiredError)
    - Map error types to Arabic error messages
    - Return consistent ErrorResponse format
    - Update file: backend/src/middleware/errorHandler.ts
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [x] 5.4 Configure CORS middleware
    - Allow requests from frontend origin (http://localhost:5173)
    - Enable credentials support
    - Allow Authorization header
    - Configure allowed methods: GET, POST, PUT, DELETE, OPTIONS
    - Add to server.ts
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 6. Implement controllers
  - [x] 6.1 Create AuthController
    - Implement login() handler method
    - Validate request body (userId and password required)
    - Extract IP address from request
    - Call AuthService.login() with credentials and IP
    - Handle success: return 200 with token and user data
    - Handle errors: return appropriate status codes with Arabic messages
    - Create file: backend/src/controllers/authController.ts
    - _Requirements: 2.1, 2.4, 2.5, 2.6, 8.1, 8.2_

  - [x] 6.2 Create UserController
    - Implement getActiveUsers() handler method
    - Call UserService.getActiveUsers()
    - Return 200 with user list on success
    - Return 500 with Arabic error message on failure
    - Create file: backend/src/controllers/userController.ts
    - _Requirements: 3.1, 3.5, 3.6_

- [x] 7. Create route handlers
  - [x] 7.1 Create auth routes
    - Define POST /api/auth/login route
    - Apply loginRateLimiter middleware to login route
    - Connect route to AuthController.login
    - Create file: backend/src/routes/auth.routes.ts
    - _Requirements: 2.1, 5.1_

  - [x] 7.2 Create user routes
    - Define GET /api/users/list route (public, no auth required)
    - Connect route to UserController.getActiveUsers
    - Create file: backend/src/routes/user.routes.ts
    - _Requirements: 3.1_

  - [x] 7.3 Register routes in main server
    - Import auth and user routes
    - Mount auth routes at /api/auth
    - Mount user routes at /api/users
    - Ensure routes are registered before error handler
    - Update file: backend/src/server.ts
    - _Requirements: 2.1, 3.1_

- [x] 8. Configure environment variables
  - [x] 8.1 Add JWT configuration to .env
    - Add JWT_SECRET with strong random 256-bit value
    - Add JWT_EXPIRATION=8h
    - Add FRONTEND_URL for CORS configuration
    - Document all new environment variables
    - Update file: backend/.env
    - _Requirements: 2.3, 4.6, 6.1_

  - [x] 8.2 Create .env.example file
    - Copy .env structure without sensitive values
    - Add comments explaining each variable
    - Include instructions for generating JWT_SECRET
    - Create file: backend/.env.example
    - _Requirements: 2.3_

- [x] 9. Update database seed script
  - [x] 9.1 Add password hashing to seed script
    - Import PasswordService
    - Hash default passwords for seeded users
    - Update existing user creation to include passwordHash
    - Create at least 1 ADMIN, 1 MANAGER, 2 SELLER users
    - Assign users to existing branches
    - Set all users to isActive = true
    - Update file: backend/prisma/seed.ts
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 9.2 Run seed script with new users
    - Execute `npx prisma db seed`
    - Verify users created with hashed passwords in database
    - Document default credentials for initial login
    - _Requirements: 9.1, 9.5_

- [x] 10. Write unit tests
  - [x] 10.1 Write PasswordService tests
    - Test hashPassword() generates valid bcrypt hash
    - Test comparePassword() returns true for correct password
    - Test comparePassword() returns false for incorrect password
    - Test validatePasswordStrength() validates minimum length
    - Create file: backend/src/services/passwordService.test.ts
    - _Requirements: 10.1_

  - [x] 10.2 Write TokenService tests
    - Test generateToken() creates valid JWT with correct payload
    - Test verifyToken() validates correct token
    - Test verifyToken() rejects expired token
    - Test verifyToken() rejects invalid signature
    - Test token includes correct expiration time (8 hours)
    - Create file: backend/src/services/tokenService.test.ts
    - _Requirements: 10.1_

  - [x] 10.3 Write AuthService tests
    - Test login() succeeds with valid credentials
    - Test login() fails with invalid password
    - Test login() fails with inactive user
    - Test login() updates lastLoginAt timestamp
    - Test login() logs authentication events
    - Mock Prisma Client and service dependencies
    - Create file: backend/src/services/authService.test.ts
    - _Requirements: 10.1_

- [x] 11. Write integration tests
  - [x] 11.1 Write login endpoint tests
    - Test POST /api/auth/login with valid credentials returns 200 and token
    - Test POST /api/auth/login with invalid password returns 401
    - Test POST /api/auth/login with inactive user returns 403
    - Test POST /api/auth/login with missing fields returns 400
    - Test rate limiting: 6th attempt within 15 minutes returns 429
    - Verify JWT token structure and expiration in response
    - Create file: backend/src/routes/auth.routes.test.ts
    - _Requirements: 10.2_

  - [x] 11.2 Write user list endpoint tests
    - Test GET /api/users/list returns all active users
    - Test GET /api/users/list includes branch names
    - Test GET /api/users/list excludes inactive users
    - Test GET /api/users/list returns empty array when no active users
    - Test GET /api/users/list returns 500 on database error
    - Create file: backend/src/routes/user.routes.test.ts
    - _Requirements: 10.2_

  - [x] 11.3 Write auth middleware tests
    - Test middleware allows request with valid token
    - Test middleware rejects request with no token (401)
    - Test middleware rejects request with expired token (401)
    - Test middleware rejects request with invalid token (401)
    - Test middleware attaches user payload to req.user
    - Create file: backend/src/middleware/authMiddleware.test.ts
    - _Requirements: 10.3_

- [-] 12. Manual testing and verification
  - [x] 12.1 Test complete authentication flow
    - Start backend server
    - Call GET /api/users/list and verify user list returned
    - Call POST /api/auth/login with valid credentials
    - Verify JWT token received in response
    - Decode JWT token and verify payload structure
    - Test token with protected endpoint (if available)
    - _Requirements: 2.1, 3.1_

  - [x] 12.2 Test error scenarios
    - Test login with wrong password (expect 401)
    - Test login with inactive user (expect 403)
    - Test login with missing fields (expect 400)
    - Test rate limiting by making 6 login attempts (expect 429 on 6th)
    - Verify Arabic error messages in all responses
    - _Requirements: 2.4, 2.5, 5.3, 8.1_

  - [x] 12.3 Verify audit logging
    - Check event_log table after successful login
    - Check event_log table after failed login
    - Verify IP address and timestamp recorded
    - Verify no sensitive data (passwords, tokens) in logs
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 12.4 Test frontend integration
    - Ensure frontend can fetch user list from GET /api/users/list
    - Ensure frontend can login via POST /api/auth/login
    - Verify CORS headers allow frontend requests
    - Test complete login flow from frontend UI
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 13. Documentation and deployment preparation
  - [x] 13.1 Create API documentation
    - Document POST /api/auth/login endpoint (request/response format)
    - Document GET /api/users/list endpoint (response format)
    - Document error codes and Arabic messages
    - Document JWT token structure and expiration
    - Create file: backend/docs/API.md
    - _Requirements: 2.1, 2.6, 3.1, 8.1_

  - [x] 13.2 Document default credentials
    - List all seeded users with their default passwords
    - Include instructions for changing passwords after first login
    - Document password requirements
    - Create file: backend/docs/DEFAULT_CREDENTIALS.md
    - _Requirements: 9.5_

  - [x] 13.3 Create deployment checklist
    - List all environment variables required
    - Document JWT_SECRET generation process
    - Include CORS configuration for production
    - Add database migration steps
    - Create file: backend/docs/DEPLOYMENT.md
    - _Requirements: 2.3, 6.5_
