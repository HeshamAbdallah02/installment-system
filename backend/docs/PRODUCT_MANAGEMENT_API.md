# Product Management API Documentation

## Overview

This document describes the Product Management API endpoints implemented for the Egyptian Retail Installments Management System.

## Base URL

All endpoints are prefixed with `/api/products`

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### 1. Get Products (Paginated with Filters)

**GET** `/api/products`

Get a paginated list of products with search and filtering capabilities.

**Query Parameters:**

- `search` (string, optional): Search by product name or code
- `category` (string, optional): Filter by category
- `minPrice` (number, optional): Minimum price filter
- `maxPrice` (number, optional): Maximum price filter
- `status` (string, optional): Filter by status (ACTIVE, OUT_OF_STOCK)
- `installmentAvailable` (boolean, optional): Filter by installment availability
- `page` (number, optional, default: 1): Page number
- `limit` (number, optional, default: 20): Items per page

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "TV-55-001",
      "name": "Samsung 55\" Smart TV",
      "description": "4K UHD Smart TV",
      "cashPrice": 15000,
      "minDepositAmount": 3000,
      "minDepositPercentage": 20,
      "category": "Electronics",
      "imageUrl": "/uploads/products/tv.jpg",
      "availableTerms": [3, 6, 12, 24],
      "customRates": null,
      "stockQuantity": 12,
      "stockStatus": "IN_STOCK",
      "status": "ACTIVE",
      "isActive": true,
      "activeInstallmentsCount": 45,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 2. Get Product by ID

**GET** `/api/products/:id`

Get complete details for a specific product including statistics, related products, and inventory history.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "TV-55-001",
    "name": "Samsung 55\" Smart TV",
    "description": "4K UHD Smart TV",
    "cashPrice": 15000,
    "category": "Electronics",
    "imageUrl": "/uploads/products/tv.jpg",
    "specifications": {
      "screen_size": "55 inches",
      "resolution": "4K UHD"
    },
    "availableTerms": [3, 6, 12, 24],
    "stockQuantity": 12,
    "stockStatus": "IN_STOCK",
    "status": "ACTIVE",
    "statistics": {
      "totalInstallments": 45,
      "activeInstallments": 38,
      "completedInstallments": 7,
      "totalRevenue": 675000,
      "averageTerm": 11.2,
      "popularTerm": 12,
      "salesTrend": "INCREASING",
      "lastSaleDate": "2025-01-10T00:00:00.000Z",
      "conversionRate": 0
    },
    "relatedProducts": [...],
    "inventoryHistory": [...]
  }
}
```

### 3. Get Popular Products

**GET** `/api/products/popular`

Get top products by active installment count.

**Query Parameters:**

- `limit` (number, optional, default: 5): Number of products to return

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Samsung 55\" Smart TV",
      "imageUrl": "/uploads/products/tv.jpg",
      "activeInstallmentsCount": 45,
      "rank": 1,
      "cashPrice": 15000,
      "category": "Electronics"
    }
  ]
}
```

### 4. Get Related Products

**GET** `/api/products/:id/related`

Get related products (same category, similar price range ±20%).

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "code": "TV-50-002",
      "name": "LG 50\" Smart TV",
      "cashPrice": 13000,
      "imageUrl": "/uploads/products/lg-tv.jpg",
      "category": "Electronics",
      "stockStatus": "IN_STOCK"
    }
  ]
}
```

### 5. Get Product Statistics

**GET** `/api/products/:id/statistics`

Get sales statistics for a specific product.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalInstallments": 45,
    "activeInstallments": 38,
    "completedInstallments": 7,
    "totalRevenue": 675000,
    "averageTerm": 11.2,
    "popularTerm": 12,
    "salesTrend": "INCREASING",
    "lastSaleDate": "2025-01-10T00:00:00.000Z",
    "conversionRate": 0
  }
}
```

### 6. Create Product

**POST** `/api/products`

Create a new product.

**Content-Type:** `multipart/form-data`

**Body Parameters:**

- `code` (string, required): Unique product code
- `name` (string, required): Product name
- `description` (string, optional): Product description
- `cashPrice` (number, required): Cash price
- `minDepositAmount` (number, optional): Minimum deposit amount
- `minDepositPercentage` (number, optional): Minimum deposit percentage
- `category` (string, optional): Product category
- `image` (file, optional): Product image (max 5MB, JPG/PNG)
- `specifications` (JSON string, optional): Product specifications
- `availableTerms` (JSON array, optional): Available installment terms
- `customRates` (JSON object, optional): Custom installment rates
- `stockQuantity` (number, optional): Initial stock quantity

**Response:**

```json
{
  "success": true,
  "data": {
    /* product object */
  },
  "message": "تم إنشاء المنتج بنجاح"
}
```

### 7. Update Product

**PUT** `/api/products/:id`

Update an existing product.

**Content-Type:** `multipart/form-data`

**Body Parameters:** (all optional)

- `name` (string): Product name
- `description` (string): Product description
- `cashPrice` (number): Cash price
- `minDepositAmount` (number): Minimum deposit amount
- `minDepositPercentage` (number): Minimum deposit percentage
- `category` (string): Product category
- `image` (file): Product image
- `specifications` (JSON string): Product specifications
- `availableTerms` (JSON array): Available installment terms
- `customRates` (JSON object): Custom installment rates

**Response:**

```json
{
  "success": true,
  "data": {
    /* updated product object */
  },
  "message": "تم تحديث المنتج بنجاح"
}
```

### 8. Deactivate Product

**POST** `/api/products/:id/deactivate`

Deactivate a product (prevents new installments but maintains existing ones).

**Body:**

```json
{
  "reason": "Product discontinued by manufacturer"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    /* updated product object */
  },
  "message": "تم إيقاف المنتج بنجاح"
}
```

### 9. Activate Product

**POST** `/api/products/:id/activate`

Reactivate a previously deactivated product.

**Response:**

```json
{
  "success": true,
  "data": {
    /* updated product object */
  },
  "message": "تم تفعيل المنتج بنجاح"
}
```

### 10. Adjust Inventory

**POST** `/api/products/:id/inventory/adjust`

Adjust product inventory with reason tracking.

**Body:**

```json
{
  "type": "RESTOCK",
  "quantity": 10,
  "reason": "New shipment received"
}
```

**Type Options:**

- `SALE`: Decrease inventory (sale made)
- `RESTOCK`: Increase inventory (new stock received)
- `DAMAGE`: Decrease inventory (damaged items)
- `RETURN`: Increase inventory (customer return)

**Response:**

```json
{
  "success": true,
  "data": {
    "product": {
      "id": 1,
      "code": "TV-55-001",
      "name": "Samsung 55\" Smart TV",
      "stockQuantity": 22,
      "stockStatus": "IN_STOCK"
    },
    "adjustment": {
      "id": 1,
      "type": "RESTOCK",
      "quantity": 10,
      "previousQuantity": 12,
      "newQuantity": 22,
      "reason": "New shipment received",
      "adjustedBy": "Ahmed Ali",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  },
  "message": "تم تعديل المخزون بنجاح"
}
```

### 11. Get Inventory History

**GET** `/api/products/:id/inventory/history`

Get inventory adjustment history for a product.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "RESTOCK",
      "quantity": 10,
      "previousQuantity": 12,
      "newQuantity": 22,
      "reason": "New shipment received",
      "adjustedBy": "Ahmed Ali",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

### 12. Bulk Price Update

**POST** `/api/products/bulk-price-update`

Update prices for multiple products at once.

**Body:**

```json
{
  "productIds": [1, 2, 3],
  "updateMethod": "percentage_increase",
  "value": 10,
  "preview": false
}
```

**Update Methods:**

- `percentage_increase`: Increase by percentage
- `percentage_decrease`: Decrease by percentage
- `fixed_increase`: Increase by fixed amount
- `fixed_decrease`: Decrease by fixed amount

**Response:**

```json
{
  "success": true,
  "data": {
    "preview": false,
    "updatedProducts": [...],
    "changes": [
      {
        "productId": 1,
        "productName": "Samsung 55\" Smart TV",
        "currentPrice": 15000,
        "newPrice": 16500,
        "change": 1500,
        "changePercentage": 10
      }
    ],
    "totalProducts": 3
  },
  "message": "تم تحديث 3 منتج بنجاح"
}
```

### 13. Export Products

**POST** `/api/products/export`

Export products to Excel or PDF format.

**Body:**

```json
{
  "format": "excel",
  "filters": {
    "category": "Electronics",
    "status": "ACTIVE"
  },
  "options": {
    "includeImages": false,
    "includeStatistics": true,
    "includeInventory": false
  }
}
```

**Response:** File download (Excel or PDF)

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "رسالة الخطأ بالعربية"
  }
}
```

**Common Error Codes:**

- `PRODUCT_NOT_FOUND`: Product not found
- `DUPLICATE_CODE`: Product code already exists
- `INVALID_PRICE`: Invalid price value
- `INVALID_DEPOSIT`: Invalid deposit amount
- `INVALID_CUSTOM_RATE`: Invalid custom rate (must be 0-20%)
- `REQUIRED_FIELDS`: Required fields missing
- `INVALID_QUANTITY`: Invalid quantity value
- `REQUIRED_ADJUSTMENT_REASON`: Adjustment reason required
- `INVALID_STOCK_QUANTITY`: Invalid stock quantity
- `NO_PRODUCTS_SELECTED`: No products selected for bulk operation
- `SERVER_ERROR`: Internal server error

## Stock Status

Products automatically update their stock status based on quantity:

- `IN_STOCK`: Quantity >= 5
- `LOW_STOCK`: Quantity 1-4
- `OUT_OF_STOCK`: Quantity = 0

## Audit Trail

All product modifications are logged in the event log:

- `PRODUCT_CREATED`: Product creation
- `PRODUCT_UPDATED`: Product update
- `PRODUCT_DEACTIVATED`: Product deactivation
- `PRODUCT_ACTIVATED`: Product activation
- `INVENTORY_ADJUSTED`: Inventory adjustment
- `PRODUCT_PRICE_UPDATED`: Price update (bulk or individual)
