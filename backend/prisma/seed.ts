import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create owner user
  const user = await prisma.user.create({
    data: {
      email: 'owner@example.com',
      name: 'System Owner',
      role: 'owner',
    },
  });
  console.log('Created user:', user.email);

  // Create sample customer
  const customer = await prisma.customer.create({
    data: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      address: '123 Main St, City, Country',
    },
  });
  console.log('Created customer:', customer.name);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
