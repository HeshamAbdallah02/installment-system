import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkLogs() {
  console.log('=== Recent Event Logs ===\n');

  const logs = await prisma.eventLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: {
        select: {
          username: true,
          fullName: true,
        },
      },
    },
  });

  logs.forEach((log, index) => {
    console.log(`${index + 1}. Event Type: ${log.eventType}`);
    console.log(`   User: ${log.user?.username || 'N/A'} (${log.user?.fullName || 'N/A'})`);
    console.log(`   IP Address: ${log.ipAddress || 'N/A'}`);
    console.log(`   Timestamp: ${log.createdAt.toISOString()}`);
    console.log(`   Event Data: ${JSON.stringify(log.eventData)}`);
    console.log('');
  });

  console.log(`Total logs found: ${logs.length}`);

  // Check for sensitive data (actual values, not just words in messages)
  console.log('\n=== Checking for Sensitive Data ===');
  const hasSensitiveData = logs.some((log) => {
    const eventData = log.eventData as any;
    // Check if there are actual password/token fields (not just the word in a message)
    return eventData?.password || eventData?.passwordHash || eventData?.token || eventData?.secret;
  });

  if (hasSensitiveData) {
    console.log('⚠️  WARNING: Sensitive data (actual passwords/tokens) found in logs!');
  } else {
    console.log('✓ No sensitive data (passwords, tokens) found in logs');
  }

  // Verify required fields are present
  console.log('\n=== Verifying Log Structure ===');
  const allHaveIpAddress = logs.every((log) => log.ipAddress !== null);
  const allHaveTimestamp = logs.every((log) => log.createdAt !== null);

  console.log(`✓ All logs have IP address: ${allHaveIpAddress ? 'Yes' : 'No'}`);
  console.log(`✓ All logs have timestamp: ${allHaveTimestamp ? 'Yes' : 'No'}`);

  await prisma.$disconnect();
}

checkLogs();
