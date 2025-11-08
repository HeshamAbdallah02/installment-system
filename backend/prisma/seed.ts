import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import passwordService from '../src/services/passwordService';

// Load environment variables
dotenv.config();

// Initialize Prisma Client (uses DATABASE_URL from .env)
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Egyptian Retail Installments database...');

  // Create branches
  const cairoBranch = await prisma.branch.create({
    data: {
      name: 'Cairo Main Branch',
      code: 'CAI-001',
      address: '123 Tahrir Square',
      city: 'Cairo',
      phone: '+20-2-1234-5678',
    },
  });
  console.log('Created branch:', cairoBranch.name);

  const alexBranch = await prisma.branch.create({
    data: {
      name: 'Alexandria Branch',
      code: 'ALX-001',
      address: '456 Corniche Road',
      city: 'Alexandria',
      phone: '+20-3-9876-5432',
    },
  });
  console.log('Created branch:', alexBranch.name);

  // Hash default password for all users
  const defaultPassword = 'Password123';
  const hashedPassword = await passwordService.hashPassword(defaultPassword);
  console.log('Generated password hash for seeded users');

  // Create users with hashed passwords
  // 1 ADMIN user
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: hashedPassword,
      fullName: 'System Administrator',
      email: 'admin@store.eg',
      role: 'ADMIN',
      branchId: cairoBranch.id,
      isActive: true,
    },
  });
  console.log('Created user:', admin.fullName, '(ADMIN)');

  // 1 MANAGER user
  const manager = await prisma.user.create({
    data: {
      username: 'mohamed.ibrahim',
      passwordHash: hashedPassword,
      fullName: 'Mohamed Ibrahim',
      email: 'mohamed.ibrahim@store.eg',
      role: 'MANAGER',
      branchId: cairoBranch.id,
      isActive: true,
    },
  });
  console.log('Created user:', manager.fullName, '(MANAGER)');

  // 2 SELLER users
  const ahmed = await prisma.user.create({
    data: {
      username: 'ahmed.hassan',
      passwordHash: hashedPassword,
      fullName: 'Ahmed Hassan',
      email: 'ahmed.hassan@store.eg',
      role: 'SELLER',
      branchId: cairoBranch.id,
      isActive: true,
    },
  });
  console.log('Created user:', ahmed.fullName, '(SELLER)');

  const fatima = await prisma.user.create({
    data: {
      username: 'fatima.ali',
      passwordHash: hashedPassword,
      fullName: 'Fatima Ali',
      email: 'fatima.ali@store.eg',
      role: 'SELLER',
      branchId: cairoBranch.id,
      isActive: true,
    },
  });
  console.log('Created user:', fatima.fullName, '(SELLER)');

  const sara = await prisma.user.create({
    data: {
      username: 'sara.mahmoud',
      passwordHash: hashedPassword,
      fullName: 'Sara Mahmoud',
      email: 'sara.mahmoud@store.eg',
      role: 'SELLER',
      branchId: alexBranch.id,
      isActive: true,
    },
  });
  console.log('Created user:', sara.fullName, '(SELLER)');

  // Create products
  const tv = await prisma.product.create({
    data: {
      code: 'TV-55-001',
      name: 'Samsung 55" Smart TV',
      description: '4K UHD Smart TV with HDR',
      cashPrice: 15000.0,
      requiresDeposit: true,
      minDepositAmount: 3000.0,
      category: 'Electronics',
    },
  });
  console.log('Created product:', tv.name);

  await prisma.product.create({
    data: {
      code: 'FRIDGE-001',
      name: 'LG Refrigerator 450L',
      description: 'Double door refrigerator',
      cashPrice: 12000.0,
      requiresDeposit: true,
      minDepositAmount: 2400.0,
      category: 'Appliances',
    },
  });

  await prisma.product.create({
    data: {
      code: 'PHONE-001',
      name: 'Samsung Galaxy A54',
      description: 'Smartphone 128GB',
      cashPrice: 6000.0,
      requiresDeposit: false,
      category: 'Electronics',
    },
  });

  // Create installment ratios
  await prisma.installmentRatio.createMany({
    data: [
      { periodMonths: 3, ratioMultiplier: 1.03, description: '3 months - 3% increase' },
      { periodMonths: 6, ratioMultiplier: 1.05, description: '6 months - 5% increase' },
      { periodMonths: 12, ratioMultiplier: 1.08, description: '12 months - 8% increase' },
      { periodMonths: 24, ratioMultiplier: 1.12, description: '24 months - 12% increase' },
    ],
  });
  console.log('Created installment ratios');

  // Create customers with Arabic names
  const customer1 = await prisma.customer.create({
    data: {
      fullName: 'محمد أحمد علي',
      nationalId: '29501011234567',
      phone: '+20-100-123-4567',
      address: 'شارع الهرم، الجيزة',
      city: 'Giza',
      createdBy: ahmed.id,
    },
  });
  console.log('Created customer:', customer1.fullName);

  const customer2 = await prisma.customer.create({
    data: {
      fullName: 'فاطمة حسن محمود',
      nationalId: '29203151234568',
      phone: '+20-120-987-6543',
      address: 'شارع النصر، مدينة نصر',
      city: 'Cairo',
      createdBy: fatima.id,
    },
  });
  console.log('Created customer:', customer2.fullName);

  console.log('\n=== Default Credentials ===');
  console.log('All users have the default password: Password123');
  console.log('Users created:');
  console.log('  - admin (ADMIN)');
  console.log('  - mohamed.ibrahim (MANAGER)');
  console.log('  - ahmed.hassan (SELLER)');
  console.log('  - fatima.ali (SELLER)');
  console.log('  - sara.mahmoud (SELLER)');
  console.log('===========================\n');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
