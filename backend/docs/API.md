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
| `INVALID_MONTHS`      | 400         | عدد الأشهر غير صحيح                                            | Invalid months parameter (must be 1-12)    |
| `INVALID_PERIOD`      | 400         | الفترة الزمنية غير صحيحة                                       | Invalid period parameter                   |
| `INVALID_LIMIT`       | 400         | الحد الأقصى غير صحيح                                           | Invalid limit parameter (must be 1-50)     |
| `INVALID_CREDENTIALS` | 401         | اسم المستخدم أو كلمة المرور غير صحيحة                          | Username or password is incorrect          |
| `NO_TOKEN`            | 401         | لم يتم توفير رمز المصادقة                                      | No authentication token provided           |
| `INVALID_TOKEN`       | 401         | رمز المصادقة غير صالح                                          | Token is malformed or signature is invalid |
| `TOKEN_EXPIRED`       | 401         | انتهت صلاحية رمز المصادقة. يرجى تسجيل الدخول مرة أخرى          | Token has expired                          |
| `ACCOUNT_DISABLED`    | 403         | تم تعطيل هذا الحساب. يرجى التواصل مع المسؤول                   | User account is disabled                   |
| `RATE_LIMIT_EXCEEDED` | 429         | تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة بعد 15 دقيقة | Too many login attempts                    |
| `SERVER_ERROR`        | 500         | خطأ في الخادم. يرجى المحاولة مرة أخرى                          | Internal server error                      |
| `DATABASE_ERROR`      | 500         | خطأ في قاعدة البيانات                                          | Database operation failed                  |
| `CALCULATION_ERROR`   | 500         | خطأ في حساب المقاييس                                           | Error calculating dashboard metrics        |

---

## Dashboard API

### 3. Get Dashboard Metrics

Retrieves real-time business KPIs including active installments, pending payments, overdue amounts, and collection rate.

**Endpoint:** `GET /api/dashboard/metrics`

**Authentication:** Required (JWT token)

**Request Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "activeInstallments": {
      "count": 45,
      "trend": 12.5
    },
    "pendingPayments": {
      "amount": 125000,
      "trend": -5.2
    },
    "overdueAmounts": {
      "amount": 15000,
      "trend": 8.3,
      "alert": false
    },
    "collectionRate": {
      "percentage": 87.5,
      "trend": 3.1,
      "alert": false
    }
  }
}
```

**Response Fields:**

- `activeInstallments.count`: Number of active installment plans (not COMPLETED or CANCELLED)
- `activeInstallments.trend`: Percentage change from previous month
- `pendingPayments.amount`: Total amount of pending payments due this month (EGP)
- `pendingPayments.trend`: Percentage change from previous month
- `overdueAmounts.amount`: Total amount of overdue payments (EGP)
- `overdueAmounts.trend`: Percentage change from previous month
- `overdueAmounts.alert`: True if overdue amount exceeds threshold
- `collectionRate.percentage`: (Paid installments / Total due) × 100 for current month
- `collectionRate.trend`: Percentage point change from previous month
- `collectionRate.alert`: True if collection rate is below 80%

**Error Responses:**

**401 Unauthorized - No Token:**

```json
{
  "success": false,
  "error": {
    "code": "NO_TOKEN",
    "message": "لم يتم توفير رمز المصادقة"
  }
}
```

**401 Unauthorized - Invalid Token:**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "رمز المصادقة غير صالح"
  }
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "خطأ في قاعدة البيانات"
  }
}
```

**Example Request:**

```bash
curl -X GET http://localhost:4000/api/dashboard/metrics \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

---

### 4. Get Collection Trends

Retrieves monthly collection trends for the specified number of past months.

**Endpoint:** `GET /api/dashboard/collection-trends`

**Authentication:** Required (JWT token)

**Query Parameters:**

| Parameter | Type   | Required | Default | Description                             |
| --------- | ------ | -------- | ------- | --------------------------------------- |
| `months`  | number | No       | 6       | Number of past months to include (1-12) |

**Request Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "months": [
      {
        "month": "يناير",
        "year": 2024,
        "amount": 450000,
        "date": "2024-01-01T00:00:00.000Z"
      },
      {
        "month": "فبراير",
        "year": 2024,
        "amount": 520000,
        "date": "2024-02-01T00:00:00.000Z"
      },
      {
        "month": "مارس",
        "year": 2024,
        "amount": 0,
        "date": "2024-03-01T00:00:00.000Z"
      }
    ],
    "totalCollected": 970000,
    "averageMonthly": 323333.33
  }
}
```

**Response Fields:**

- `months`: Array of monthly collection data, sorted chronologically (oldest to newest)
- `months[].month`: Arabic month name (يناير, فبراير, مارس, etc.)
- `months[].year`: Year of the month
- `months[].amount`: Total payments collected in that month (EGP)
- `months[].date`: ISO date string for the first day of the month
- `totalCollected`: Sum of all amounts in the period (EGP)
- `averageMonthly`: Average collection per month (EGP)

**Error Responses:**

**400 Bad Request - Invalid Months Parameter:**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_MONTHS",
    "message": "عدد الأشهر غير صحيح"
  }
}
```

**401 Unauthorized:**

```json
{
  "success": false,
  "error": {
    "code": "NO_TOKEN",
    "message": "لم يتم توفير رمز المصادقة"
  }
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "خطأ في قاعدة البيانات"
  }
}
```

**Example Requests:**

```bash
# Default (6 months)
curl -X GET http://localhost:4000/api/dashboard/collection-trends \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Custom months
curl -X GET "http://localhost:4000/api/dashboard/collection-trends?months=12" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 5. Get Branch Distribution

Retrieves payment distribution across branches for the specified period.

**Endpoint:** `GET /api/dashboard/branch-distribution`

**Authentication:** Required (JWT token)

**Query Parameters:**

| Parameter | Type   | Required | Default         | Description                                           |
| --------- | ------ | -------- | --------------- | ----------------------------------------------------- |
| `period`  | string | No       | `current_month` | Time period: `current_month`, `last_month`, `quarter` |

**Request Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "branches": [
      {
        "branchId": 1,
        "branchName": "فرع القاهرة",
        "amount": 350000,
        "percentage": 45.5,
        "installmentCount": 28
      },
      {
        "branchId": 2,
        "branchName": "فرع الإسكندرية",
        "amount": 280000,
        "percentage": 36.4,
        "installmentCount": 22
      },
      {
        "branchId": 3,
        "branchName": "فرع الجيزة",
        "amount": 140000,
        "percentage": 18.1,
        "installmentCount": 15
      }
    ],
    "totalCollections": 770000
  }
}
```

**Response Fields:**

- `branches`: Array of branch performance data, sorted by amount descending
- `branches[].branchId`: Unique identifier of the branch
- `branches[].branchName`: Arabic name of the branch
- `branches[].amount`: Total payments collected by this branch (EGP)
- `branches[].percentage`: (Branch amount / Total amount) × 100
- `branches[].installmentCount`: Number of active installments for this branch
- `totalCollections`: Sum of all branch amounts (EGP)

**Error Responses:**

**400 Bad Request - Invalid Period:**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PERIOD",
    "message": "الفترة الزمنية غير صحيحة"
  }
}
```

**401 Unauthorized:**

```json
{
  "success": false,
  "error": {
    "code": "NO_TOKEN",
    "message": "لم يتم توفير رمز المصادقة"
  }
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "خطأ في قاعدة البيانات"
  }
}
```

**Example Requests:**

```bash
# Default (current month)
curl -X GET http://localhost:4000/api/dashboard/branch-distribution \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Last month
curl -X GET "http://localhost:4000/api/dashboard/branch-distribution?period=last_month" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Quarter
curl -X GET "http://localhost:4000/api/dashboard/branch-distribution?period=quarter" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 6. Get Top Products

Retrieves the top 5 products by active installment count.

**Endpoint:** `GET /api/dashboard/top-products`

**Authentication:** Required (JWT token)

**Request Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "productId": 5,
        "productName": "ثلاجة سامسونج 18 قدم",
        "installmentCount": 18,
        "totalValue": 540000,
        "rank": 1
      },
      {
        "productId": 3,
        "productName": "غسالة LG 10 كيلو",
        "installmentCount": 15,
        "totalValue": 375000,
        "rank": 2
      },
      {
        "productId": 8,
        "productName": "تلفزيون سمارت 55 بوصة",
        "installmentCount": 12,
        "totalValue": 360000,
        "rank": 3
      },
      {
        "productId": 1,
        "productName": "مكيف هواء 2.25 حصان",
        "installmentCount": 10,
        "totalValue": 250000,
        "rank": 4
      },
      {
        "productId": 12,
        "productName": "بوتاجاز 5 شعلة",
        "installmentCount": 8,
        "totalValue": 120000,
        "rank": 5
      }
    ],
    "totalInstallments": 63
  }
}
```

**Response Fields:**

- `products`: Array of top 5 products, sorted by installment count descending
- `products[].productId`: Unique identifier of the product
- `products[].productName`: Arabic name of the product
- `products[].installmentCount`: Number of active installments for this product
- `products[].totalValue`: Sum of all installment plan amounts for this product (EGP)
- `products[].rank`: Ranking position (1 = highest installment count)
- `totalInstallments`: Sum of installment counts across all top products

**Error Responses:**

**401 Unauthorized:**

```json
{
  "success": false,
  "error": {
    "code": "NO_TOKEN",
    "message": "لم يتم توفير رمز المصادقة"
  }
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "خطأ في قاعدة البيانات"
  }
}
```

**Example Request:**

```bash
curl -X GET http://localhost:4000/api/dashboard/top-products \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

---

### 7. Get Recent Activities

Retrieves recent system activities from the event log.

**Endpoint:** `GET /api/dashboard/activities`

**Authentication:** Required (JWT token)

**Query Parameters:**

| Parameter | Type   | Required | Default | Description                             |
| --------- | ------ | -------- | ------- | --------------------------------------- |
| `limit`   | number | No       | 10      | Number of activities to return (max 50) |

**Request Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": 1523,
        "type": "PAYMENT_RECORDED",
        "title": "تسجيل دفعة جديدة",
        "description": "تم تسجيل دفعة بمبلغ 5000 جنيه للعميل أحمد محمد",
        "timestamp": "2024-11-10T14:30:00.000Z",
        "userId": 3,
        "userName": "فاطمة علي",
        "metadata": {
          "customerName": "أحمد محمد",
          "amount": 5000,
          "productName": "ثلاجة سامسونج"
        }
      },
      {
        "id": 1522,
        "type": "INSTALLMENT_CREATED",
        "title": "إنشاء خطة تقسيط جديدة",
        "description": "تم إنشاء خطة تقسيط لمنتج غسالة LG للعميل سارة أحمد",
        "timestamp": "2024-11-10T13:15:00.000Z",
        "userId": 2,
        "userName": "محمد حسن",
        "metadata": {
          "customerName": "سارة أحمد",
          "productName": "غسالة LG 10 كيلو",
          "amount": 25000
        }
      },
      {
        "id": 1521,
        "type": "USER_LOGIN",
        "title": "تسجيل دخول مستخدم",
        "description": "قام محمد حسن بتسجيل الدخول",
        "timestamp": "2024-11-10T09:00:00.000Z",
        "userId": 2,
        "userName": "محمد حسن",
        "metadata": {}
      }
    ],
    "lastUpdated": "2024-11-10T14:30:00.000Z"
  }
}
```

**Response Fields:**

- `activities`: Array of recent activities, sorted by timestamp descending (newest first)
- `activities[].id`: Unique identifier of the event log entry
- `activities[].type`: Event type (USER_LOGIN, PAYMENT_RECORDED, INSTALLMENT_CREATED, PAYMENT_OVERDUE)
- `activities[].title`: Arabic title describing the activity
- `activities[].description`: Detailed Arabic description with context
- `activities[].timestamp`: ISO timestamp when the event occurred
- `activities[].userId`: ID of the user who performed the action
- `activities[].userName`: Full name of the user in Arabic
- `activities[].metadata`: Additional context data (customer name, amount, product name, etc.)
- `lastUpdated`: Timestamp of the most recent activity

**Error Responses:**

**400 Bad Request - Invalid Limit:**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_LIMIT",
    "message": "الحد الأقصى غير صحيح"
  }
}
```

**401 Unauthorized:**

```json
{
  "success": false,
  "error": {
    "code": "NO_TOKEN",
    "message": "لم يتم توفير رمز المصادقة"
  }
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "خطأ في قاعدة البيانات"
  }
}
```

**Example Requests:**

```bash
# Default (10 activities)
curl -X GET http://localhost:4000/api/dashboard/activities \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Custom limit
curl -X GET "http://localhost:4000/api/dashboard/activities?limit=25" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

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

### Version 1.1.0 (Dashboard API)

- GET /api/dashboard/metrics - Real-time business KPIs
- GET /api/dashboard/collection-trends - Monthly collection analysis
- GET /api/dashboard/branch-distribution - Branch performance comparison
- GET /api/dashboard/top-products - Top 5 products by installment count
- GET /api/dashboard/activities - Recent system activities feed
- Database indexes for optimized dashboard queries
- Query result caching (5-10 minute TTL)
- Performance monitoring and slow query logging

### Version 1.0.0 (Initial Release)

- POST /api/auth/login - User authentication
- GET /api/users/list - Retrieve active users
- JWT token-based authentication
- Rate limiting on login endpoint
- Arabic error messages
- Audit logging for authentication events
