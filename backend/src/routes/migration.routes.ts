import { Router, Request, Response } from 'express';
import prisma from '../prismaClient';

const router = Router();

router.post('/rename-deposit-to-minprice', async (req: Request, res: Response) => {
  try {
    console.log('Running migration: Renaming minPrice to minPrice...');
    
    // Rename minPrice to minPrice
    await prisma.$executeRawUnsafe(`
      ALTER TABLE products 
      RENAME COLUMN "minPrice" TO "minPrice";
    `);
    console.log('✓ Renamed minPrice to minPrice');
    
    res.json({ 
      success: true, 
      message: 'Renamed minPrice to minPrice successfully! Please run: npx prisma generate' 
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/fix-null-deposits', async (req: Request, res: Response) => {
  try {
    console.log('Running migration: Fixing NULL minPrice values...');

    // Update NULL minPrice to 0
    await prisma.$executeRawUnsafe(`
      UPDATE products 
      SET "minPrice" = 0 
      WHERE "minPrice" IS NULL;
    `);
    console.log('✓ Updated NULL minPrice values to 0');

    res.json({
      success: true,
      message: 'Fixed NULL minPrice values successfully!',
    });
  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/add-selling-price', async (req: Request, res: Response) => {
  try {
    console.log(
      'Running migration: Renaming cashPrice to installmentPrice and adding sellingPrice...'
    );

    // Step 1: Rename cashPrice to installmentPrice (if it exists)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE products 
        RENAME COLUMN "cashPrice" TO "installmentPrice";
      `);
      console.log('✓ Renamed cashPrice to installmentPrice');
    } catch (e: unknown) {
      const error = e as { code?: string; meta?: { code?: string } };
      if (error.code === 'P2010' && error.meta?.code === '42703') {
        console.log('⚠ cashPrice column already renamed or does not exist, skipping...');
      } else {
        throw e;
      }
    }

    // Step 2: Add sellingPrice column (if it doesn't exist)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE products 
        ADD COLUMN "sellingPrice" DECIMAL(12, 2);
      `);
      console.log('✓ Added sellingPrice column');
    } catch (e: unknown) {
      const error = e as { code?: string; meta?: { code?: string } };
      if (error.code === 'P2010' && error.meta?.code === '42701') {
        console.log('⚠ sellingPrice column already exists, skipping...');
      } else {
        throw e;
      }
    }

    // Step 3: Update existing products: set sellingPrice equal to installmentPrice
    await prisma.$executeRawUnsafe(`
      UPDATE products 
      SET "sellingPrice" = "installmentPrice" 
      WHERE "sellingPrice" IS NULL;
    `);
    console.log('✓ Updated existing products with sellingPrice');

    // Step 4: Make sellingPrice NOT NULL
    await prisma.$executeRawUnsafe(`
      ALTER TABLE products 
      ALTER COLUMN "sellingPrice" SET NOT NULL;
    `);
    console.log('✓ Made sellingPrice NOT NULL');

    // Step 5: Make minPrice NOT NULL (if needed)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE products 
        ALTER COLUMN "minPrice" SET NOT NULL;
      `);
      console.log('✓ Made minPrice NOT NULL');
    } catch (e: unknown) {
      console.log('⚠ minPrice constraint already exists or has NULL values');
    }

    console.log('✓ Migration completed successfully!');

    res.json({
      success: true,
      message: 'Migration completed successfully! Please run: npx prisma generate',
    });
  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
