-- Migration: Remove Branch Functionality
-- This migration removes all branch-related tables, columns, and constraints
-- Requirements: 1.1, 1.2, 1.3, 1.4, 1.5

-- Step 1: Drop foreign key constraint from orders.branchId to branches.id
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_branchId_fkey";

-- Step 2: Drop foreign key constraint from users.branchId to branches.id
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_branchId_fkey";

-- Step 3: Remove the branchId column from the orders table
ALTER TABLE "orders" DROP COLUMN IF EXISTS "branchId";

-- Step 4: Remove the branchId column from the users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "branchId";

-- Step 5: Drop the branches table entirely
DROP TABLE IF EXISTS "branches";
