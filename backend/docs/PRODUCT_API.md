# Product Management API

## Overview

This document describes the Product Management API endpoints for creating and updating products in the system.

## Endpoints

### Create Product

**POST** `/api/products`

Creates a new product in the system.

#### Headers

- `Authorization: Bearer <token>` (Required)
- `Content-Type: multipart/form-data`

#### Request Body (Form Data)

| Field                | Type        | Required | Description                                        |
| -------------------- | ----------- | -------- | -------------------------------------------------- |
| code                 | string      | Yes      | Unique product code                                |
| name                 | string      | Yes      | Product name                                       |
| cashPrice            | number      | Yes      | Cash price (must be > 0)                           |
| description          | string      | No       | Product description                                |
| category             | string      | No       | Product category                                   |
| minDepositAmount     | number      | No       | Minimum deposit amount                             |
| minDepositPercentage | number      | No       | Minimum deposit percentage                         |
| image                | file        | No       | Product image (JPG/PNG, max 5MB)                   |
| specifications       | JSON string | No       | Product specifications as JSON object              |
| availableTerms       | JSON array  | No       | Available installment terms (e.g., [3, 6, 12, 24]) |
| customRates          | JSON object | No       | Custom interest rates per term                     |
| stockQuantity        | number      | No       | Initial stock quantity                             |

#### Response

**Success (201 Created)**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "PROD-001",
    "name": "Samsung 55\" Smart TV",
    "description": "4K UHD Smart TV",
    "cashPrice": 15000,
    "minDepositAmount": 3000,
    "minDepositPercentage": 20,
    "category": "Electronics",
    "imageUrl": "/uploads/products/samsung-tv-1234567890.jpg",
    "specifications": {
      "screen_size": "55 inches",
      "resolution": "4K UHD"
    },
    "availableTerms": [3, 6, 12, 24],
    "customRates": null,
    "stockQuantity": 10,
    "stockStatus": "IN_STOCK",
    "status": "ACTIVE",
    "isActive": true,
    "createdAt": "2025-11-13T12:00:00.000Z",
    "updatedAt": "2025-11-13T12:00:00.000Z"
  },
  "message": "تم إنشاء المنتج بنجاح"
}
```

**Error Responses**

- **400 Bad Request** - Validation error

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PRICE",
    "message": "السعر يجب أن يكون أكبر من صفر"
  }
}
```

- **409 Conflict** - Duplicate product code

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_CODE",
    "message": "كود المنتج موجود بالفعل"
  }
}
```

### Update Product

**PUT** `/api/products/:id`

Updates an existing product. Product code cannot be changed.

#### Headers

- `Authorization: Bearer <token>` (Required)
- `Content-Type: multipart/form-data`

#### URL Parameters

- `id` (number) - Product ID

#### Request Body (Form Data)

All fields are optional. Only provided fields will be updated.

| Field                | Type        | Description                           |
| -------------------- | ----------- | ------------------------------------- |
| name                 | string      | Product name                          |
| cashPrice            | number      | Cash price (must be > 0)              |
| description          | string      | Product description                   |
| category             | string      | Product category                      |
| minDepositAmount     | number      | Minimum deposit amount                |
| minDepositPercentage | number      | Minimum deposit percentage            |
| image                | file        | Product image (JPG/PNG, max 5MB)      |
| specifications       | JSON string | Product specifications as JSON object |
| availableTerms       | JSON array  | Available installment terms           |
| customRates          | JSON object | Custom interest rates per term        |

#### Response

**Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "PROD-001",
    "name": "Samsung 55\" Smart TV - Updated",
    "cashPrice": 14500,
    ...
  },
  "message": "تم تحديث المنتج بنجاح"
}
```

**Error Responses**

- **400 Bad Request** - Invalid ID or validation error

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ID",
    "message": "معرف المنتج غير صالح"
  }
}
```

- **404 Not Found** - Product not found

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "المنتج غير موجود"
  }
}
```

## Validation Rules

### Product Code

- Required for creation
- Must be unique
- Cannot be changed after creation

### Cash Price

- Required for creation
- Must be greater than 0

### Minimum Deposit

- Optional
- If provided, must be less than cash price

### Custom Rates

- Optional
- Each rate must be between 0-20%

### Image Upload

- Optional
- Allowed formats: JPG, PNG
- Maximum size: 5MB
- Stored in `/uploads/products/` directory

### Stock Status

- Automatically calculated based on stock quantity:
  - `OUT_OF_STOCK`: quantity = 0
  - `LOW_STOCK`: quantity < 5
  - `IN_STOCK`: quantity >= 5

## Audit Trail

All product creation and update operations are logged in the audit trail (`event_log` table) with:

- Event type: `PRODUCT_CREATED` or `PRODUCT_UPDATED`
- User ID of the person who performed the action
- Timestamp
- Changes made (for updates)

## Example Usage

### Create Product with cURL

```bash
curl -X POST http://localhost:4000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "code=PROD-001" \
  -F "name=Samsung 55\" Smart TV" \
  -F "cashPrice=15000" \
  -F "category=Electronics" \
  -F "description=4K UHD Smart TV" \
  -F "minDepositAmount=3000" \
  -F "availableTerms=[3,6,12,24]" \
  -F "stockQuantity=10" \
  -F "image=@/path/to/image.jpg"
```

### Update Product with cURL

```bash
curl -X PUT http://localhost:4000/api/products/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Samsung 55\" Smart TV - Updated" \
  -F "cashPrice=14500" \
  -F "image=@/path/to/new-image.jpg"
```

## Notes

- All endpoints require authentication
- Image uploads are optional but recommended
- Product code is immutable after creation
- Changes are logged in the audit trail for compliance
- Stock status is automatically managed based on quantity
