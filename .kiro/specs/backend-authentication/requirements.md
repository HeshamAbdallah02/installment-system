# Requirements Document

## Introduction

This document specifies the requirements for a secure backend authentication system for the Egyptian Retail Installments Management System. The authentication system provides REST API endpoints for user authentication, session management, and user data retrieval. It integrates with the existing Prisma database schema, implements industry-standard security practices including password hashing with bcrypt and JWT token-based authentication, and supports the Arabic RTL frontend login interface.

## Glossary

- **Authentication API**: The backend REST API endpoints that handle user login, token generation, and user list retrieval
- **JWT Token**: JSON Web Token used for stateless authentication, containing user identity and expiration information
- **Password Hash**: A one-way cryptographic hash of the user's password using bcrypt algorithm with salt rounds
- **Prisma Client**: The TypeScript ORM client that provides type-safe database access to PostgreSQL
- **User Session**: The authenticated state maintained via JWT token stored in the client's localStorage
- **Active User**: A user account with isActive flag set to true in the database
- **Rate Limiting**: A security mechanism that restricts the number of login attempts from a single IP address within a time window
- **CORS Policy**: Cross-Origin Resource Sharing configuration that controls which frontend origins can access the API
- **Middleware**: Express.js functions that process requests before they reach route handlers
- **Token Expiration**: The time duration after which a JWT token becomes invalid and requires re-authentication

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want user passwords to be securely hashed and stored, so that user credentials are protected even if the database is compromised.

#### Acceptance Criteria

1. THE Authentication API SHALL hash all user passwords using bcrypt algorithm with a minimum of 10 salt rounds before storing in the database
2. THE Authentication API SHALL never store plain text passwords in the database
3. WHEN a new user is created, THE Authentication API SHALL generate a Password Hash from the provided plain text password
4. WHEN a user password is updated, THE Authentication API SHALL generate a new Password Hash and replace the existing hash
5. THE Authentication API SHALL validate passwords by comparing the provided plain text against the stored Password Hash using bcrypt compare function

### Requirement 2

**User Story:** As a store seller, I want to authenticate with my credentials and receive a secure token, so that I can access the system without re-entering my password for each request.

#### Acceptance Criteria

1. WHEN the Authentication API receives a POST request to /api/auth/login with valid userId and password, THE Authentication API SHALL verify the credentials against the database
2. WHEN credentials are valid and the user account is active, THE Authentication API SHALL generate a JWT Token containing userId, username, role, and branchId
3. WHEN a JWT Token is generated, THE Authentication API SHALL set the token expiration to 8 hours from creation time
4. WHEN credentials are invalid, THE Authentication API SHALL return HTTP status 401 with error code "INVALID_CREDENTIALS"
5. WHEN the user account is inactive (isActive = false), THE Authentication API SHALL return HTTP status 403 with error code "ACCOUNT_DISABLED"
6. WHEN authentication succeeds, THE Authentication API SHALL return HTTP status 200 with the JWT Token and user information (id, fullName, role, branchName)

### Requirement 3

**User Story:** As a frontend developer, I want to retrieve a list of all active users with their branch information, so that I can populate the login dropdown with user options.

#### Acceptance Criteria

1. THE Authentication API SHALL provide a GET endpoint at /api/users/list that returns all Active Users
2. WHEN the /api/users/list endpoint is called, THE Authentication API SHALL query the database for users where isActive is true
3. WHEN retrieving users, THE Authentication API SHALL include the associated branch name for each user via Prisma relation
4. THE Authentication API SHALL return user data in the format: {id, fullName, branchName, isActive}
5. WHEN no active users exist, THE Authentication API SHALL return an empty array with HTTP status 200
6. WHEN a database error occurs, THE Authentication API SHALL return HTTP status 500 with error message "خطأ في تحميل قائمة المستخدمين"

### Requirement 4

**User Story:** As a system administrator, I want protected API endpoints to verify JWT tokens, so that only authenticated users can access sensitive operations.

#### Acceptance Criteria

1. THE Authentication API SHALL provide an authentication Middleware that validates JWT Tokens on protected routes
2. WHEN a request includes a valid JWT Token in the Authorization header, THE Middleware SHALL decode the token and attach user information to the request object
3. WHEN a request includes an expired JWT Token, THE Middleware SHALL return HTTP status 401 with error code "TOKEN_EXPIRED"
4. WHEN a request includes an invalid or malformed JWT Token, THE Middleware SHALL return HTTP status 401 with error code "INVALID_TOKEN"
5. WHEN a request to a protected route has no Authorization header, THE Middleware SHALL return HTTP status 401 with error code "NO_TOKEN"
6. THE Middleware SHALL verify the JWT Token signature using the secret key from environment variables

### Requirement 5

**User Story:** As a security administrator, I want the login endpoint to be protected against brute force attacks, so that malicious actors cannot repeatedly attempt to guess passwords.

#### Acceptance Criteria

1. THE Authentication API SHALL implement Rate Limiting on the /api/auth/login endpoint
2. THE Authentication API SHALL allow a maximum of 5 login attempts per IP address within a 15-minute window
3. WHEN the rate limit is exceeded, THE Authentication API SHALL return HTTP status 429 with error message "تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة بعد 15 دقيقة"
4. WHEN the time window expires, THE Authentication API SHALL reset the attempt counter for that IP address
5. THE Authentication API SHALL log all failed login attempts with IP address and timestamp to the EventLog table

### Requirement 6

**User Story:** As a frontend developer, I want the API to support CORS requests from the frontend application, so that the browser allows API calls from the React application.

#### Acceptance Criteria

1. THE Authentication API SHALL configure CORS Policy to allow requests from the frontend origin (http://localhost:5173 in development)
2. THE Authentication API SHALL allow the following HTTP methods: GET, POST, PUT, DELETE, OPTIONS
3. THE Authentication API SHALL allow the Authorization header in CORS requests
4. THE Authentication API SHALL include credentials support in CORS configuration
5. WHEN deployed to production, THE Authentication API SHALL restrict CORS to the production frontend domain only

### Requirement 7

**User Story:** As a system administrator, I want all authentication events to be logged, so that I can audit user access and investigate security incidents.

#### Acceptance Criteria

1. WHEN a user successfully logs in, THE Authentication API SHALL create an EventLog entry with eventType "USER_LOGIN"
2. WHEN a login attempt fails due to invalid credentials, THE Authentication API SHALL create an EventLog entry with eventType "LOGIN_FAILED"
3. WHEN a login attempt fails due to disabled account, THE Authentication API SHALL create an EventLog entry with eventType "LOGIN_DISABLED_ACCOUNT"
4. THE Authentication API SHALL store the following information in EventLog: userId (if known), eventType, eventData (IP address, user agent), timestamp
5. THE Authentication API SHALL not log sensitive information such as passwords or tokens in EventLog entries

### Requirement 8

**User Story:** As a developer, I want comprehensive error handling with Arabic error messages, so that users receive clear feedback in their native language.

#### Acceptance Criteria

1. THE Authentication API SHALL return all error messages in Arabic language
2. WHEN a validation error occurs, THE Authentication API SHALL return HTTP status 400 with descriptive Arabic error message
3. WHEN a database error occurs, THE Authentication API SHALL return HTTP status 500 with generic Arabic error message without exposing internal details
4. WHEN a network timeout occurs, THE Authentication API SHALL return HTTP status 504 with Arabic timeout message
5. THE Authentication API SHALL use consistent error response format: {success: false, error: {code: string, message: string}}

### Requirement 9

**User Story:** As a system administrator, I want to seed the database with initial user accounts, so that the system can be accessed immediately after deployment.

#### Acceptance Criteria

1. THE Authentication API SHALL provide a database seed script that creates initial user accounts with hashed passwords
2. THE Authentication API SHALL create at least one ADMIN user, one MANAGER user, and two SELLER users during seeding
3. WHEN seeding users, THE Authentication API SHALL assign each user to an existing branch from the branches table
4. THE Authentication API SHALL set all seeded users to active status (isActive = true)
5. THE Authentication API SHALL use secure default passwords that are documented separately for initial login

### Requirement 10

**User Story:** As a developer, I want the authentication system to be easily testable, so that I can verify functionality and prevent regressions.

#### Acceptance Criteria

1. THE Authentication API SHALL provide unit tests for password hashing and verification functions
2. THE Authentication API SHALL provide integration tests for the /api/auth/login endpoint covering success and error cases
3. THE Authentication API SHALL provide integration tests for the /api/users/list endpoint
4. THE Authentication API SHALL provide tests for the authentication Middleware with valid, invalid, and expired tokens
5. THE Authentication API SHALL achieve minimum 80% code coverage for authentication-related modules
