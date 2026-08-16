const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function resetPassword(email, newPassword = 'Password123!') {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const user = await prisma.user.update({
    where: { email: email.toLowerCase().trim() },
    data: {
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
  console.log(`Password for ${user.email} has been reset to: ${newPassword}`);
}

const targetEmail = process.argv[2] || 'meetc8030@gmail.com';
const targetPassword = process.argv[3] || 'Password123!';

resetPassword(targetEmail, targetPassword)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
