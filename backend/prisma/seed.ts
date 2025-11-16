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

  // Installment ratios removed - no longer needed
  // Product prices now include any markup, and monthly payment = price / months
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

  // Create sample orders and installments for dashboard data
  console.log('\nCreating sample installment plans...');

  // Generate unique order numbers
  const orderNumber1 = `ORD-${Date.now()}-1`;
  const orderNumber2 = `ORD-${Date.now()}-2`;

  // Order 1: TV for customer1 (12 months, 3 payments made)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: orderNumber1,
      customerId: customer1.id,
      branchId: cairoBranch.id,
      totalAmount: 15000.0,
      paymentType: 'INSTALLMENT',
      status: 'CONFIRMED',
      createdBy: ahmed.id,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order1.id,
      productId: tv.id,
      quantity: 1,
      unitPrice: 15000.0,
      lineTotal: 15000.0,
    },
  });

  const startDate1 = new Date('2025-01-01');
  const endDate1 = new Date('2025-12-31');

  const installmentPlan1 = await prisma.installmentPlan.create({
    data: {
      customerId: customer1.id,
      orderId: order1.id,
      totalAmount: 15000.0,
      depositAmount: 3000.0,
      financedAmount: 12000.0,
      periodMonths: 12,
      ratioMultiplier: 1.08,
      totalWithRatio: 12960.0, // 12000 * 1.08
      monthlyAmount: 1080.0, // 12960 / 12
      startDate: startDate1,
      endDate: endDate1,
      status: 'ACTIVE',
      createdBy: ahmed.id,
    },
  });

  // Create 12-month installment schedule
  for (let i = 1; i <= 12; i++) {
    const dueDate = new Date('2025-01-01');
    dueDate.setMonth(dueDate.getMonth() + i);

    await prisma.installmentSchedule.create({
      data: {
        planId: installmentPlan1.id,
        sequenceNumber: i,
        dueDate: dueDate,
        totalAmount: 1080.0,
        principalAmount: 1000.0,
        extraAmount: 80.0,
        paidAmount: i <= 3 ? 1080.0 : 0,
        status: i <= 3 ? 'PAID' : 'PENDING',
        paidDate: i <= 3 ? dueDate : null,
      },
    });
  }

  // Create payment records for first 3 installments
  const paidSchedules1 = await prisma.installmentSchedule.findMany({
    where: {
      planId: installmentPlan1.id,
      sequenceNumber: { lte: 3 },
    },
  });

  for (const schedule of paidSchedules1) {
    const paymentNumber = `PAY-${Date.now()}-${schedule.sequenceNumber}`;
    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        customerId: customer1.id,
        orderId: order1.id,
        amount: 1080.0,
        paymentMethod: 'CASH',
        collectedBy: ahmed.id,
        paymentDate: schedule.dueDate,
      },
    });

    // Create payment allocation
    await prisma.paymentAllocation.create({
      data: {
        paymentId: payment.id,
        scheduleId: schedule.id,
        allocationType: 'PRINCIPAL',
        amount: 1080.0,
      },
    });
  }

  console.log('Created installment plan 1: TV - 12 months, 3 payments made');

  // Order 2: Fridge for customer2 (6 months, 1 payment made)
  const fridge = await prisma.product.findFirst({
    where: { code: 'FRIDGE-001' },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: orderNumber2,
      customerId: customer2.id,
      branchId: cairoBranch.id,
      totalAmount: 12000.0,
      paymentType: 'INSTALLMENT',
      status: 'CONFIRMED',
      createdBy: fatima.id,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      productId: fridge!.id,
      quantity: 1,
      unitPrice: 12000.0,
      lineTotal: 12000.0,
    },
  });

  const startDate2 = new Date('2025-02-01');
  const endDate2 = new Date('2025-07-31');

  const installmentPlan2 = await prisma.installmentPlan.create({
    data: {
      customerId: customer2.id,
      orderId: order2.id,
      totalAmount: 12000.0,
      depositAmount: 2400.0,
      financedAmount: 9600.0,
      periodMonths: 6,
      ratioMultiplier: 1.05,
      totalWithRatio: 10080.0, // 9600 * 1.05
      monthlyAmount: 1680.0, // 10080 / 6
      startDate: startDate2,
      endDate: endDate2,
      status: 'ACTIVE',
      createdBy: fatima.id,
    },
  });

  // Create 6-month installment schedule
  for (let i = 1; i <= 6; i++) {
    const dueDate = new Date('2025-02-01');
    dueDate.setMonth(dueDate.getMonth() + i);

    await prisma.installmentSchedule.create({
      data: {
        planId: installmentPlan2.id,
        sequenceNumber: i,
        dueDate: dueDate,
        totalAmount: 1680.0,
        principalAmount: 1600.0,
        extraAmount: 80.0,
        paidAmount: i === 1 ? 1680.0 : 0,
        status: i === 1 ? 'PAID' : 'PENDING',
        paidDate: i === 1 ? dueDate : null,
      },
    });
  }

  // Create payment for first installment
  const firstSchedule2 = await prisma.installmentSchedule.findFirst({
    where: {
      planId: installmentPlan2.id,
      sequenceNumber: 1,
    },
  });

  if (firstSchedule2) {
    const paymentNumber2 = `PAY-${Date.now()}-F1`;
    const payment2 = await prisma.payment.create({
      data: {
        paymentNumber: paymentNumber2,
        customerId: customer2.id,
        orderId: order2.id,
        amount: 1680.0,
        paymentMethod: 'BANK_TRANSFER',
        collectedBy: fatima.id,
        paymentDate: firstSchedule2.dueDate,
      },
    });

    // Create payment allocation
    await prisma.paymentAllocation.create({
      data: {
        paymentId: payment2.id,
        scheduleId: firstSchedule2.id,
        allocationType: 'PRINCIPAL',
        amount: 1680.0,
      },
    });
  }

  console.log('Created installment plan 2: Fridge - 6 months, 1 payment made');

  // Create event logs for activities
  await prisma.eventLog.create({
    data: {
      userId: ahmed.id,
      eventType: 'INSTALLMENT_CREATED',
      entityType: 'INSTALLMENT_PLAN',
      entityId: installmentPlan1.id,
      eventData: {
        description: 'Created installment plan for محمد أحمد علي',
        productName: 'Samsung 55" Smart TV',
        termMonths: 12,
      },
    },
  });

  await prisma.eventLog.create({
    data: {
      userId: fatima.id,
      eventType: 'INSTALLMENT_CREATED',
      entityType: 'INSTALLMENT_PLAN',
      entityId: installmentPlan2.id,
      eventData: {
        description: 'Created installment plan for فاطمة حسن محمود',
        productName: 'LG Refrigerator 450L',
        termMonths: 6,
      },
    },
  });

  await prisma.eventLog.create({
    data: {
      userId: ahmed.id,
      eventType: 'PAYMENT_RECEIVED',
      entityType: 'PAYMENT',
      entityId: paidSchedules1[0].id,
      eventData: {
        description: 'Payment received from محمد أحمد علي',
        amount: 1080.0,
        method: 'CASH',
      },
    },
  });

  console.log('Created event logs for activities');

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
