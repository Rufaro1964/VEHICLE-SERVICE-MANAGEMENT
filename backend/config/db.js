const mysql = require('mysql');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool for MariaDB
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Demaga_360',
    database: process.env.DB_NAME || 'vehicle_service',
    port: process.env.DB_PORT || 3306,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    charset: 'utf8mb4',  // Important for MariaDB
    timezone: 'local'    // Important for timestamps
});

// Promisify pool.query for async/await
const query = (sql, values) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, values, (error, results, fields) => {
            if (error) {
                console.error('Database query error:', error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ MariaDB connection failed:', err.message);
        console.error('Error code:', err.code);
        console.error('\n🔧 Troubleshooting steps:');
        console.error('1. Check if MariaDB is running: sudo service mariadb status');
        console.error('2. Test connection manually:');
        console.error('   mysql -u root -pDemaga_360');
        console.error('3. Check if database exists:');
        console.error('   SHOW DATABASES;');
        console.error('4. Create database if needed:');
        console.error('   CREATE DATABASE vehicle_service;');
    } else {
        console.log('✅ Connected to MariaDB successfully!');
        console.log(`📊 Database: ${connection.config.database}`);
        console.log(`🌐 Host: ${connection.config.host}`);
        console.log(`👤 User: ${connection.config.user}`);
        console.log(`🚀 MariaDB version: ${connection.serverVersion}`);
        
        // Test query
        connection.query('SELECT 1 + 1 AS result, VERSION() as version', (err, results) => {
            if (err) {
                console.error('Test query failed:', err.message);
            } else {
                console.log('✓ Test query successful');
                console.log(`  Result: ${results[0].result}`);
                console.log(`  MariaDB Version: ${results[0].version}`);
            }
            connection.release();
        });
    }
});

// Export both pool and promisified query
module.exports = {
    pool,
    query,
    
    // Promisified getConnection
    getConnection: () => {
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) reject(err);
                else resolve(connection);
            });
        });
    },
    
    // Transaction support
    beginTransaction: () => {
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) reject(err);
                else {
                    connection.beginTransaction(err => {
                        if (err) {
                            connection.release();
                            reject(err);
                        } else {
                            resolve(connection);
                        }
                    });
                }
            });
        });
    },
    
    commitTransaction: (connection) => {
        return new Promise((resolve, reject) => {
            connection.commit(err => {
                if (err) reject(err);
                else {
                    connection.release();
                    resolve();
                }
            });
        });
    },
    
    rollbackTransaction: (connection) => {
        return new Promise((resolve, reject) => {
            connection.rollback(() => {
                connection.release();
                resolve();
            });
        });
    }
};
