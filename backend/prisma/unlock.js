const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function unlockAll() {
  const res = await prisma.user.updateMany({
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
  console.log(`Unlocked ${res.count} user accounts.`);
}

unlockAll()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
