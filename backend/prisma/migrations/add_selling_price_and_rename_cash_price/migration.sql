-- AlterTable: Add sellingPrice column and rename cashPrice to installmentPrice
-- Make minDepositAmount required (NOT NULL)

-- Step 1: Add new sellingPrice column (nullable first)
ALTER TABLE "products" ADD COLUMN "sellingPrice" DECIMAL(12,2);

-- Step 2: Copy cashPrice to both sellingPrice and rename cashPrice column
-- For existing products, set sellingPrice = cashPrice initially
UPDATE "products" SET "sellingPrice" = "cashPrice";

-- Step 3: Rename cashPrice to installmentPrice
ALTER TABLE "products" RENAME COLUMN "cashPrice" TO "installmentPrice";

-- Step 4: Make sellingPrice NOT NULL now that it has values
ALTER TABLE "products" ALTER COLUMN "sellingPrice" SET NOT NULL;

-- Step 5: Make minDepositAmount NOT NULL with default 0 for existing records
UPDATE "products" SET "minDepositAmount" = 0 WHERE "minDepositAmount" IS NULL;
ALTER TABLE "products" ALTER COLUMN "minDepositAmount" SET NOT NULL;
