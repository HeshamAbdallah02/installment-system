-- AlterTable
ALTER TABLE "users" ADD COLUMN "passwordHash" VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- Remove default after adding column (to match schema)
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP DEFAULT;
