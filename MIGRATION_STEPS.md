# Database Migration Steps

## Issue

The backend is timing out because the database schema has changed but hasn't been migrated yet.

## Solution

### Step 1: Stop the Backend Server

Press `Ctrl+C` in the terminal where the backend is running (port 4000)

### Step 2: Generate Prisma Client

```bash
cd backend
npx prisma generate
```

### Step 3: Run the Migration

```bash
npx prisma migrate dev --name add_selling_price_and_rename_cash_price
```

This will:

- Create a new migration file
- Apply the schema changes to your database
- Add `sellingPrice` field
- Rename `cashPrice` to `installmentPrice`
- Make `minDepositAmount` required

### Step 4: Update Existing Data (if needed)

If you have existing products in the database, run this SQL to set default values:

```sql
-- Set sellingPrice = installmentPrice for existing products
UPDATE products SET "sellingPrice" = "installmentPrice" WHERE "sellingPrice" IS NULL;

-- Set minDepositAmount = 0 for any NULL values
UPDATE products SET "minDepositAmount" = 0 WHERE "minDepositAmount" IS NULL;
```

### Step 5: Restart the Backend

```bash
npm run dev
```

### Step 6: Restart the Frontend

The frontend should automatically reconnect once the backend is running.

## Alternative: Use the Migration Script

If you prefer, you can manually run the migration SQL file we created:

```bash
cd backend
npx prisma db execute --file prisma/migrations/add_selling_price_and_rename_cash_price/migration.sql
```

## Verification

After migration, verify the schema:

```bash
npx prisma studio
```

Check that products table has:

- ✅ `sellingPrice` (Decimal, NOT NULL)
- ✅ `installmentPrice` (Decimal, NOT NULL) - renamed from cashPrice
- ✅ `minDepositAmount` (Decimal, NOT NULL) - now required
