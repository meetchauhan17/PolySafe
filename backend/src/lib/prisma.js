const { PrismaClient } = require('@prisma/client');

// Singleton Prisma client — avoids creating a new connection pool on every require()
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
