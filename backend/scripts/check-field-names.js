// scripts/check-field-names.js
const prisma = require('../lib/prisma');

async function checkFieldNames() {
    console.log('🔍 Checking actual field names in your database...\n');
    
    try {
        await prisma.$connect();
        
        // Get actual field names from each table
        const tables = ['users', 'vehicles', 'services', 'notifications'];
        
        for (const table of tables) {
            console.log(`📋 ${table.toUpperCase()}:`);
            
            try {
                const record = await prisma[table].findFirst();
                if (record) {
                    console.log('   Field names:', Object.keys(record).join(', '));
                    
                    // Show some values
                    const sampleFields = Object.entries(record)
                        .slice(0, 5)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ');
                    console.log('   Sample:', sampleFields);
                } else {
                    console.log('   No records found');
                }
            } catch (err) {
                console.log(`   Error: ${err.message}`);
            }
            console.log('');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkFieldNames();