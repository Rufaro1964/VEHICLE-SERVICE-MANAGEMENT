const db = require('../config/db');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;

// @desc    Get all vehicles
// @route   GET /api/vehicles
exports.getAllVehicles = async (req, res) => {
    try {
        let query = `
            SELECT v.*, 
                   u.username as owner_name,
                   COUNT(s.id) as service_count,
                   MAX(s.service_date) as last_service_date
            FROM vehicles v
            LEFT JOIN users u ON v.user_id = u.id
            LEFT JOIN services s ON v.id = s.vehicle_id
            WHERE v.user_id = ?
            GROUP BY v.id
            ORDER BY v.created_at DESC
        `;
        
        const params = [req.user.id];
        
        // Admin can see all vehicles
        if (req.user.role === 'admin') {
            query = query.replace('WHERE v.user_id = ?', '');
            params.pop();
        }
        
        const [vehicles] = await db.query(query, params);
        
        res.json({
            success: true,
            count: vehicles.length,
            data: vehicles
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
exports.getVehicle = async (req, res) => {
    try {
        const [vehicles] = await db.query(
            `SELECT v.*, u.username as owner_name 
             FROM vehicles v 
             LEFT JOIN users u ON v.user_id = u.id 
             WHERE v.id = ?`,
            [req.params.id]
        );
        
        if (vehicles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }
        
        // Check ownership (unless admin)
        if (req.user.role !== 'admin' && vehicles[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        res.json({
            success: true,
            data: vehicles[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create vehicle
// @route   POST /api/vehicles
exports.createVehicle = async (req, res) => {
    try {
        const { 
            plate_number, 
            chassis_number, 
            make, 
            model, 
            year, 
            color, 
            current_mileage = 0 
        } = req.body;
        
        // Check if plate or chassis already exists
        const [existing] = await db.query(
            'SELECT id FROM vehicles WHERE plate_number = ? OR chassis_number = ?',
            [plate_number, chassis_number]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Plate number or chassis number already exists'
            });
        }
        
        // Calculate next service (default 5000 miles from current)
        const next_service_due = parseFloat(current_mileage) + 5000;
        
        // Insert vehicle
        const [result] = await db.query(
            `INSERT INTO vehicles 
             (user_id, plate_number, chassis_number, make, model, year, color, current_mileage, next_service_due) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, plate_number, chassis_number, make, model, year, color, current_mileage, next_service_due]
        );
        
        // Generate QR code
        const qrData = {
            vehicleId: result.insertId,
            plateNumber: plate_number,
            chassisNumber: chassis_number,
            info: `${make} ${model} ${year}`
        };
        
        const qrPath = `qrcodes/vehicle-${result.insertId}-${Date.now()}.png`;
        const fullPath = path.join(__dirname, '../public', qrPath);
        
        // Ensure directory exists
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        
        await QRCode.toFile(fullPath, JSON.stringify(qrData), {
            width: 300,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        
        // Update vehicle with QR code path
        await db.query(
            'UPDATE vehicles SET qr_code_path = ? WHERE id = ?',
            [`/${qrPath}`, result.insertId]
        );
        
        // Get created vehicle
        const [vehicles] = await db.query(
            'SELECT * FROM vehicles WHERE id = ?',
            [result.insertId]
        );
        
        res.status(201).json({
            success: true,
            data: vehicles[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
exports.updateVehicle = async (req, res) => {
    try {
        const { current_mileage, ...updateData } = req.body;
        
        // Get current vehicle
        const [vehicles] = await db.query(
            'SELECT * FROM vehicles WHERE id = ?',
            [req.params.id]
        );
        
        if (vehicles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }
        
        const vehicle = vehicles[0];
        
        // Check ownership
        if (req.user.role !== 'admin' && vehicle.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        // If mileage updated, check if service is due
        if (current_mileage && current_mileage !== vehicle.current_mileage) {
            if (current_mileage >= vehicle.next_service_due) {
                // Service due - send notification
                const io = req.app.get('io');
                io.to(`user_${vehicle.user_id}`).emit('service-due', {
                    vehicleId: vehicle.id,
                    plateNumber: vehicle.plate_number,
                    currentMileage: current_mileage,
                    dueMileage: vehicle.next_service_due
                });
            }
        }
        
        // Update vehicle
        const updateFields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updateData), req.params.id];
        
        if (updateFields) {
            await db.query(
                `UPDATE vehicles SET ${updateFields} WHERE id = ?`,
                values
            );
        }
        
        // Update mileage separately if provided
        if (current_mileage) {
            await db.query(
                'UPDATE vehicles SET current_mileage = ? WHERE id = ?',
                [current_mileage, req.params.id]
            );
        }
        
        // Get updated vehicle
        const [updatedVehicles] = await db.query(
            'SELECT * FROM vehicles WHERE id = ?',
            [req.params.id]
        );
        
        res.json({
            success: true,
            data: updatedVehicles[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
exports.deleteVehicle = async (req, res) => {
    try {
        // Check if vehicle exists
        const [vehicles] = await db.query(
            'SELECT * FROM vehicles WHERE id = ?',
            [req.params.id]
        );
        
        if (vehicles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }
        
        // Check ownership
        if (req.user.role !== 'admin' && vehicles[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        // Delete vehicle (cascade will delete services)
        await db.query('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
        
        // Delete QR code if exists
        if (vehicles[0].qr_code_path) {
            const qrPath = path.join(__dirname, '..', 'public', vehicles[0].qr_code_path);
            try {
                await fs.unlink(qrPath);
            } catch (err) {
                console.warn('Could not delete QR code:', err.message);
            }
        }
        
        res.json({
            success: true,
            message: 'Vehicle deleted successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get vehicles due for service
// @route   GET /api/vehicles/due/service
exports.getDueForService = async (req, res) => {
    try {
        const query = `
            SELECT v.*, u.email, u.username
            FROM vehicles v
            JOIN users u ON v.user_id = u.id
            WHERE (v.current_mileage >= v.next_service_due 
                   OR v.next_service_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY))
            ${req.user.role !== 'admin' ? 'AND v.user_id = ?' : ''}
            ORDER BY v.next_service_due ASC
        `;
        
        const params = req.user.role !== 'admin' ? [req.user.id] : [];
        
        const [vehicles] = await db.query(query, params);
        
        res.json({
            success: true,
            count: vehicles.length,
            data: vehicles
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get vehicle QR code
// @route   GET /api/vehicles/:id/qr
exports.getVehicleQR = async (req, res) => {
    try {
        const [vehicles] = await db.query(
            'SELECT qr_code_path FROM vehicles WHERE id = ?',
            [req.params.id]
        );
        
        if (vehicles.length === 0 || !vehicles[0].qr_code_path) {
            return res.status(404).json({
                success: false,
                message: 'QR code not found'
            });
        }
        
        res.json({
            success: true,
            qrCodeUrl: vehicles[0].qr_code_path
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};