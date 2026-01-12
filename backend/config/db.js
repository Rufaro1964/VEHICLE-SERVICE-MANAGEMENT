const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Demaga_360',
    database: process.env.DB_NAME || 'vehicle_service',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

const promisePool = pool.promise();

// Test connection
promisePool.getConnection()
    .then(async connection => {
        console.log('✅ Database connected successfully');
        console.log(`Connected to database: ${connection.config.database}`);
        console.log(`Host: ${connection.config.host}`);
        console.log(`User: ${connection.config.user}`);
        
        // Optional: Test a simple query
        const [rows] = await connection.query('SELECT 1 + 1 AS result');
        console.log('Query test successful, result:', rows[0].result);
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:');
        console.error('Error:', err.message);
        console.error('Code:', err.code);
        console.error('Check:');
        console.error('- Is MySQL running?');
        console.error('- Are credentials correct?');
        console.error('- Is database name correct?');
    });

module.exports = promisePool;