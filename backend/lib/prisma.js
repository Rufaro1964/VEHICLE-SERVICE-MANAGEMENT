// lib/prisma.js
const { PrismaClient } = require('@prisma/client');

// Create a single instance of PrismaClient
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Optional: Add error handling for connection
prisma.$connect()
  .then(() => console.log('✅ Prisma connected to database'))
  .catch(err => console.error('❌ Prisma connection error:', err));

module.exports = prisma;