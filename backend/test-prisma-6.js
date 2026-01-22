const prisma = require('./lib/prisma');

async function test() {
  try {
    console.log('🧪 Testing Prisma 6 connection...');
    
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Check users
    const userCount = await prisma.users.count();
    console.log(`📊 Found ${userCount} users`);
    
    // Check one user's field names
    const user = await prisma.users.findFirst();
    if (user) {
      console.log('📋 User model field names:', Object.keys(user).join(', '));
      
      // Check if field is created_at or createdAt
      const createdAtField = 'created_at' in user ? 'created_at' : 
                            'createdAt' in user ? 'createdAt' : 'unknown';
      console.log(`   Timestamp field is: ${createdAtField}`);
    }
    
    // Check vehicles
    const vehicleCount = await prisma.vehicles.count();
    console.log(`🚗 Found ${vehicleCount} vehicles`);
    
    console.log('\n🎉 Prisma 6 is working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
