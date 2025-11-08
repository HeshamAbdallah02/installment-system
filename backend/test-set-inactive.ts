import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function setUserInactive() {
  const username = process.argv[2];
  const isActive = process.argv[3] === 'true';

  if (!username) {
    console.log('Usage: ts-node test-set-inactive.ts <username> <true|false>');
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { username },
    data: { isActive },
  });

  console.log(`User ${user.username} set to isActive=${user.isActive}`);
  await prisma.$disconnect();
}

setUserInactive();
