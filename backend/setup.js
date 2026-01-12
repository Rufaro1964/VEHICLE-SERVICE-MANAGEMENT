const mysql = require('mysql');
const fs = require('fs').promises;
const path = require('path');

const setupDatabase = async () => {
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: ''
    });
    
    try {
        // Read SQL file
        const sql = await fs.readFile(path.join(__dirname, 'setup-database.sql'), 'utf8');
        
        // Split into individual statements
        const statements = sql.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            await connection.promise().query(statement);
        }
        
        console.log('✅ Database setup completed successfully!');
        console.log('📊 Default users created:');
        console.log('   👑 Admin: admin@example.com / admin123');
        console.log('   👤 User: user@example.com / user123');
    } catch (err) {
        console.error('❌ Database setup failed:', err.message);
    } finally {
        connection.end();
    }
};

setupDatabase();