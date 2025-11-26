import * as dotenv from 'dotenv';
dotenv.config();

import prisma from './src/prismaClient';

async function runMigration() {
  try {
    console.log('Running migration: Adding sellingPrice column...');

    // Add sellingPrice column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS "sellingPrice" DECIMAL(12, 2);
    `);

    console.log('Column added. Updating existing products...');

    // Update existing products: set sellingPrice equal to installmentPrice
    await prisma.$executeRawUnsafe(`
      UPDATE products 
      SET "sellingPrice" = "installmentPrice" 
      WHERE "sellingPrice" IS NULL;
    `);

    console.log('Existing products updated. Making column NOT NULL...');

    // Make sellingPrice NOT NULL
    await prisma.$executeRawUnsafe(`
      ALTER TABLE products 
      ALTER COLUMN "sellingPrice" SET NOT NULL;
    `);

    console.log('✓ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
