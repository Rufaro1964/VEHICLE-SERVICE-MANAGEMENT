-- Create database
CREATE DATABASE IF NOT EXISTS vehicle_service;
USE vehicle_service;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service types
CREATE TABLE IF NOT EXISTS service_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    mileage_interval DECIMAL(10,2) DEFAULT 5000,
    time_interval_months INT DEFAULT 6,
    cost_estimate DECIMAL(10,2) DEFAULT 100.00
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    chassis_number VARCHAR(50) UNIQUE NOT NULL,
    make VARCHAR(50),
    model VARCHAR(50),
    year INT,
    color VARCHAR(30),
    current_mileage DECIMAL(10,2) DEFAULT 0,
    last_service_mileage DECIMAL(10,2) DEFAULT 0,
    last_service_date DATE,
    next_service_due DECIMAL(10,2),
    next_service_date DATE,
    qr_code_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_plate (plate_number)
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_id INT NOT NULL,
    service_type_id INT,
    service_date DATE NOT NULL,
    mileage_at_service DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    notes TEXT,
    next_service_due DECIMAL(10,2),
    next_service_date DATE,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'completed',
    invoice_number VARCHAR(50),
    technician_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (service_type_id) REFERENCES service_types(id),
    FOREIGN KEY (technician_id) REFERENCES users(id),
    INDEX idx_vehicle (vehicle_id),
    INDEX idx_date (service_date)
);

-- Spare parts table
CREATE TABLE IF NOT EXISTS spare_parts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_id INT NOT NULL,
    part_name VARCHAR(100) NOT NULL,
    part_number VARCHAR(50),
    quantity INT DEFAULT 1,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    warranty_months INT,
    supplier VARCHAR(100),
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    vehicle_id INT,
    type ENUM('service_due', 'reminder', 'system', 'alert') DEFAULT 'system',
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    INDEX idx_user_notif (user_id, is_read)
);

-- Insert default service types
INSERT INTO service_types (name, description, mileage_interval, time_interval_months, cost_estimate) VALUES
('Normal Service', 'Regular maintenance service', 5000, 6, 100.00),
('Oil Change', 'Engine oil and filter change', 3000, 3, 50.00),
('Major Service', 'Comprehensive service', 15000, 12, 300.00),
('Brake Service', 'Brake pads and fluid replacement', 10000, 12, 150.00),
('Tire Replacement', 'Tire change and alignment', 20000, 24, 200.00);

-- Insert admin user (password: admin123)
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrYV7.6v7Qy6cA.6z5Lq5Q5.5Z5Q5Z5', 'admin');

-- Insert regular user (password: user123)
INSERT INTO users (username, email, password) VALUES
('user', 'user@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrYV7.6v7Qy6cA.6z5Lq5Q5.5Z5Q5Z5');