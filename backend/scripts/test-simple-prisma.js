// scripts/test-simple-prisma.js
async function testPrisma() {
  try {
    // Dynamically load Prisma with minimal config
    const { PrismaClient } = require('@prisma/client')
    
    const prisma = new PrismaClient({
      log: ['error']  // Minimal log
    })
    
    await prisma.$connect()
    console.log('✅ Connected to database')
    
    // Test a simple query
    const users = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Raw query works:', users)
    
    // Check users table
    const userCount = await prisma.users.count()
    console.log(`✅ Found ${userCount} users`)
    
    await prisma.$disconnect()
    console.log('✅ Test completed successfully')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  }
}

testPrisma()