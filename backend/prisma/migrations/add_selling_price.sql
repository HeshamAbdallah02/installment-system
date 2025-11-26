-- Add sellingPrice column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS "sellingPrice" DECIMAL(12, 2);

-- Update existing products: set sellingPrice equal to installmentPrice
UPDATE products 
SET "sellingPrice" = "installmentPrice" 
WHERE "sellingPrice" IS NULL;

-- Make sellingPrice NOT NULL after setting values
ALTER TABLE products 
ALTER COLUMN "sellingPrice" SET NOT NULL;
