const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const emails = [
    'demo@gmail.com',
    'demodoc@gmail.com',
    'democar@gmail.com',
    'meetc8030@gmail.com',
    'cse.230840131016@gmail.com',
    'meetc8031@gmail.com'
  ];

  console.log('=== VERIFYING ALL 6 ACCOUNTS IN DB ===');
  for (const email of emails) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        patient: {
          include: {
            medicines: { where: { removedAt: null } },
            interactionFlags: true,
            connections: { include: { connectedUser: true } },
          }
        },
        connections: { include: { patient: { include: { user: true } } } },
      }
    });

    if (!user) {
      console.log(`❌ ${email}: NOT FOUND`);
      continue;
    }

    console.log(`\n▶ ${user.email} [${user.role}] - "${user.name}"`);
    console.log(`  PasswordHash present: ${!!user.passwordHash}`);
    console.log(`  Failed attempts: ${user.failedLoginAttempts}, Locked: ${user.lockedUntil}`);

    if (user.patient) {
      console.log(`  Patient ID: ${user.patient.id}`);
      console.log(`  Age: ${user.patient.age}, Conditions: ${JSON.stringify(user.patient.conditions)}`);
      console.log(`  Active Medicines (${user.patient.medicines.length}): ${user.patient.medicines.map(m => m.name).join(', ')}`);
      console.log(`  Interaction Flags (${user.patient.interactionFlags.length})`);
      console.log(`  Patient's connections (${user.patient.connections.length}):`);
      for (const c of user.patient.connections) {
        console.log(`    - Connected with: ${c.connectedUser?.email} (${c.role}, status: ${c.status})`);
      }
    }

    if (user.connections && user.connections.length > 0) {
      console.log(`  User's connected patients (${user.connections.length}):`);
      for (const c of user.connections) {
        console.log(`    - Linked to patient user: ${c.patient?.user?.email} (${c.role}, status: ${c.status})`);
      }
    } else if (user.role !== 'PATIENT') {
      console.log(`  User's connected patients: 0 (empty)`);
    }
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
