-- Create database if not exists
CREATE DATABASE IF NOT EXISTS vehicle_service;
USE vehicle_service;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'user', 'technician') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Insert demo users (plain passwords for testing)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@example.com', 'admin123', 'admin'),
('Demo User', 'user@example.com', 'user123', 'user'),
('Technician', 'tech@example.com', 'user123', 'technician')
ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role);

-- Verify
SELECT '✅ Database setup complete!' as message;
SELECT '📊 Users in database:' as info;
SELECT id, name, email, role FROM users;
