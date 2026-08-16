const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearAllUserData() {
  console.log('Clearing all user data from database...');

  // Delete dependent rows first (respecting foreign key constraints)
  const deletedOtps = await prisma.otpCode.deleteMany({});
  console.log(`Deleted ${deletedOtps.count} OTP codes.`);

  const deletedPending = await prisma.pendingSignup.deleteMany({});
  console.log(`Deleted ${deletedPending.count} pending signups.`);

  const deletedConnections = await prisma.connection.deleteMany({});
  console.log(`Deleted ${deletedConnections.count} connections.`);

  const deletedFlags = await prisma.interactionFlag.deleteMany({});
  console.log(`Deleted ${deletedFlags.count} interaction flags.`);

  const deletedSymptoms = await prisma.symptom.deleteMany({});
  console.log(`Deleted ${deletedSymptoms.count} symptom logs.`);

  const deletedMedicines = await prisma.medicine.deleteMany({});
  console.log(`Deleted ${deletedMedicines.count} medicines.`);

  const deletedPatients = await prisma.patient.deleteMany({});
  console.log(`Deleted ${deletedPatients.count} patient records.`);

  const deletedUsers = await prisma.user.deleteMany({});
  console.log(`Deleted ${deletedUsers.count} user accounts.`);

  console.log('All user accounts and related personal records have been completely cleared.');
}

clearAllUserData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
