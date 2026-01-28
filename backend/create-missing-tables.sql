USE vehicle_service;

-- Create service_types table if not exists
CREATE TABLE IF NOT EXISTS service_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    estimated_duration INT,
    base_cost DECIMAL(10, 2),
    mileage_interval INT,
    time_interval INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create services table if not exists
CREATE TABLE IF NOT EXISTS services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_id INT NOT NULL,
    service_type_id INT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    service_date DATE NOT NULL,
    mileage_at_service DECIMAL(10, 2) NOT NULL,
    technician_id INT,
    labor_cost DECIMAL(10, 2) DEFAULT 0,
    parts_cost DECIMAL(10, 2) DEFAULT 0,
    total_cost DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('paid', 'pending', 'partial') DEFAULT 'pending',
    service_status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    next_service_date DATE,
    next_service_mileage DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (service_type_id) REFERENCES service_types(id) ON DELETE SET NULL,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create spare_parts table if not exists
CREATE TABLE IF NOT EXISTS spare_parts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_id INT NOT NULL,
    part_name VARCHAR(200) NOT NULL,
    part_number VARCHAR(100),
    quantity INT NOT NULL DEFAULT 1,
    unit_cost DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Insert default service types
INSERT IGNORE INTO service_types (name, description, estimated_duration, base_cost, mileage_interval, time_interval) VALUES
('Oil Change', 'Engine oil and filter change', 60, 50.00, 5000, 180),
('Brake Service', 'Brake pads and fluid check/replacement', 120, 150.00, 20000, 365),
('Tire Rotation', 'Tire rotation and pressure check', 45, 30.00, 8000, 180),
('Engine Tune-up', 'Spark plugs, filters, and overall engine check', 180, 300.00, 30000, 730),
('AC Service', 'Air conditioning system service', 90, 100.00, 0, 365),
('Battery Check', 'Battery health and charging system check', 30, 20.00, 0, 180),
('Wheel Alignment', 'Wheel alignment and balancing', 60, 80.00, 15000, 365),
('Transmission Service', 'Transmission fluid change', 120, 200.00, 60000, 1095);

-- Add sample data if users and vehicles exist
-- Insert sample services if we have vehicles
INSERT IGNORE INTO services (vehicle_id, service_type_id, invoice_number, service_date, mileage_at_service, total_cost, service_status) 
SELECT 
    1, 
    1, 
    'INV-001', 
    CURDATE() - INTERVAL 30 DAY, 
    44000, 
    120.50, 
    'completed'
FROM dual 
WHERE EXISTS (SELECT 1 FROM vehicles WHERE id = 1)
AND NOT EXISTS (SELECT 1 FROM services WHERE invoice_number = 'INV-001');
