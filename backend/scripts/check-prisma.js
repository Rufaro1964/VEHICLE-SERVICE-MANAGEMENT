// scripts/check-prisma.js
const prisma = require('../lib/prisma');

async function checkPrisma() {
    console.log('🔍 Checking Prisma setup...');
    
    try {
        // 1. Test connection
        await prisma.$connect();
        console.log('✅ Connected to database');
        
        // 2. Check users table
        const userCount = await prisma.users.count();
        console.log(`✅ Found ${userCount} users`);
        
        // 3. Check one user's fields
        const sampleUser = await prisma.users.findFirst();
        if (sampleUser) {
            console.log('✅ Sample user fields:', Object.keys(sampleUser));
            console.log('   Note field names:', 
                'id:', typeof sampleUser.id,
                'username:', typeof sampleUser.username,
                'created_at:', sampleUser.created_at ? 'exists' : 'missing',
                'createdAt:', sampleUser.createdAt ? 'exists' : 'missing'
            );
        }
        
        // 4. Check other tables
        const tables = ['vehicles', 'services', 'notifications'];
        for (const table of tables) {
            try {
                const count = await prisma[table].count();
                console.log(`✅ ${table}: ${count} records`);
            } catch (err) {
                console.log(`⚠️  ${table}: ${err.message}`);
            }
        }
        
        console.log('\n🎉 Prisma is working!');
        console.log('\nNext: Test your auth endpoints');
        console.log('1. POST /api/auth/login');
        console.log('2. GET /api/auth/me (with token)');
        
    } catch (error) {
        console.error('❌ Prisma check failed:', error.message);
    } finally {
        await prisma.$disconnect();
        console.log('\n🔌 Disconnected from database');
    }
}

checkPrisma();