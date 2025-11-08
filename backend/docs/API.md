# Authentication API Documentation

## Overview

This document describes the REST API endpoints for the Backend Authentication System. All endpoints return JSON responses and use standard HTTP status codes. Error messages are provided in Arabic for end-user clarity.

## Base URL

- **Development:** `http://localhost:4000`
- **Production:** `https://your-api-domain.com`

## Authentication

Protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. User Login

Authenticates a user and returns a JWT token for subsequent requests.

**Endpoint:** `POST /api/auth/login`

**Rate Limiting:** 5 attempts per 15 minutes per IP address

**Request Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "userId": "string",
  "password": "string"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "fullName": "أحمد محمد",
    "role": "SELLER",
    "branch": "فرع القاهرة"
  }
}
```

**Error Responses:**

**400 Bad Request - Missing Fields:**

```json
{
  "success": false,
  "error": {
    "code": "MISSING_FIELDS",
    "message": "يرجى إدخال اسم المستخدم وكلمة المرور"
  }
}
```

**401 Unauthorized - Invalid Credentials:**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "اسم المستخدم أو كلمة المرور غير صحيحة"
  }
}
```

**403 Forbidden - Account Disabled:**

```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_DISABLED",
    "message": "تم تعطيل هذا الحساب. يرجى التواصل مع المسؤول"
  }
}
```

**429 Too Many Requests - Rate Limit Exceeded:**

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة بعد 15 دقيقة"
  }
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "خطأ في الخادم. يرجى المحاولة مرة أخرى"
  }
}
```

**Example Request:**

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "ahmed.seller",
    "password": "Sabaya2024!"
  }'
```

---

### 2. Get Active Users List

Retrieves a list of all active users with their branch information. This endpoint is public and does not require authentication.

**Endpoint:** `GET /api/users/list`

**Request Headers:**

```
Content-Type: application/json
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "users": [
    {
      "id": "1",
      "fullName": "أحمد محمد",
      "branchName": "فرع القاهرة",
      "isActive": true
    },
    {
      "id": "2",
      "fullName": "فاطمة علي",
      "branchName": "فرع الإسكندرية",
      "isActive": true
    }
  ]
}
```

**Success Response - No Active Users (200 OK):**

```json
{
  "success": true,
  "users": []
}
```

**Error Response (500 Internal Server Error):**

```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "خطأ في تحميل قائمة المستخدمين"
  }
}
```

**Example Request:**

```bash
curl -X GET http://localhost:4000/api/users/list \
  -H "Content-Type: application/json"
```

---

## JWT Token Structure

The JWT token returned from the login endpoint contains the following payload:

```json
{
  "userId": 1,
  "username": "ahmed.seller",
  "role": "SELLER",
  "branchId": 1,
  "iat": 1699459200,
  "exp": 1699488000
}
```

**Token Properties:**

- `userId` (number): The unique identifier of the user
- `username` (string): The username of the authenticated user
- `role` (string): User role - one of: `SELLER`, `MANAGER`, `ADMIN`
- `branchId` (number | null): The ID of the user's assigned branch
- `iat` (number): Issued at timestamp (Unix epoch)
- `exp` (number): Expiration timestamp (Unix epoch)

**Token Expiration:** 8 hours from issuance

**Token Usage:**

Include the token in the Authorization header for protected endpoints:

```bash
curl -X GET http://localhost:4000/api/protected-endpoint \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Error Codes Reference

| Error Code            | HTTP Status | Arabic Message                                                 | Description                                |
| --------------------- | ----------- | -------------------------------------------------------------- | ------------------------------------------ |
| `MISSING_FIELDS`      | 400         | يرجى إدخال اسم المستخدم وكلمة المرور                           | Required fields are missing from request   |
| `INVALID_CREDENTIALS` | 401         | اسم المستخدم أو كلمة المرور غير صحيحة                          | Username or password is incorrect          |
| `NO_TOKEN`            | 401         | لم يتم توفير رمز المصادقة                                      | No authentication token provided           |
| `INVALID_TOKEN`       | 401         | رمز المصادقة غير صالح                                          | Token is malformed or signature is invalid |
| `TOKEN_EXPIRED`       | 401         | انتهت صلاحية رمز المصادقة. يرجى تسجيل الدخول مرة أخرى          | Token has expired                          |
| `ACCOUNT_DISABLED`    | 403         | تم تعطيل هذا الحساب. يرجى التواصل مع المسؤول                   | User account is disabled                   |
| `RATE_LIMIT_EXCEEDED` | 429         | تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة بعد 15 دقيقة | Too many login attempts                    |
| `SERVER_ERROR`        | 500         | خطأ في الخادم. يرجى المحاولة مرة أخرى                          | Internal server error                      |
| `DATABASE_ERROR`      | 500         | خطأ في قاعدة البيانات                                          | Database operation failed                  |

---

## User Roles

The system supports three user roles with different permission levels:

- **SELLER**: Basic user role for store sellers
- **MANAGER**: Elevated permissions for branch managers
- **ADMIN**: Full system access for administrators

---

## Security Considerations

### Password Security

- Passwords are hashed using bcrypt with 10 salt rounds
- Plain text passwords are never stored or logged
- Minimum password length: 8 characters

### Token Security

- JWT tokens are signed with a secret key
- Tokens expire after 8 hours
- Use HTTPS in production to prevent token interception
- Store tokens securely in client (localStorage or httpOnly cookies)

### Rate Limiting

- Login endpoint is rate-limited to 5 attempts per 15 minutes per IP
- Prevents brute force attacks
- Failed attempts are logged for security monitoring

### CORS

- API is configured to accept requests only from authorized frontend origins
- Credentials are supported for cookie-based authentication
- Preflight requests are handled automatically

---

## Testing the API

### Using cURL

**Login:**

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId": "ahmed.seller", "password": "Sabaya2024!"}'
```

**Get Users:**

```bash
curl -X GET http://localhost:4000/api/users/list
```

### Using Postman

1. Create a new POST request to `http://localhost:4000/api/auth/login`
2. Set header: `Content-Type: application/json`
3. Set body (raw JSON):
   ```json
   {
     "userId": "ahmed.seller",
     "password": "Sabaya2024!"
   }
   ```
4. Send request and copy the token from response
5. Use token in Authorization header for protected endpoints

---

## Changelog

### Version 1.0.0 (Initial Release)

- POST /api/auth/login - User authentication
- GET /api/users/list - Retrieve active users
- JWT token-based authentication
- Rate limiting on login endpoint
- Arabic error messages
- Audit logging for authentication events
