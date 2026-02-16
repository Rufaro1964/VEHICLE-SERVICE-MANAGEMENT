// controllers/vehicleController.js - FIXED VERSION
const prisma = require('../lib/prisma')
const QRCode = require('qrcode')
const path = require('path')
const fs = require('fs').promises

// @desc    Get all vehicles - USE exports.getAllVehicles
exports.getAllVehicles = async (req, res) => {
    try {
        let queryCondition = req.user.role !== 'admin' ? { user_id: req.user.id } : {}
        
        const vehicles = await prisma.vehicles.findMany({
            where: queryCondition,
            include: {
                users: {
                    select: { username: true }
                }
            },
            orderBy: { created_at: 'desc' }
        })
        
        // Format response
        const formattedVehicles = vehicles.map(vehicle => ({
            ...vehicle,
            owner_name: vehicle.users?.username,
            service_count: 0, // You'll need to add this with a separate query
            last_service_date: null
        }))
        
        res.json({
            success: true,
            count: vehicles.length,
            data: formattedVehicles
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
}

// @desc    Get single vehicle
exports.getVehicle = async (req, res) => {
    try {
        const vehicle = await prisma.vehicles.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                users: {
                    select: { username: true }
                }
            }
        })
        
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            })
        }
        
        // Check ownership (unless admin)
        if (req.user.role !== 'admin' && vehicle.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            })
        }
        
        res.json({
            success: true,
            data: vehicle
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
}

// @desc    Create vehicle
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
        } = req.body
        
        // Check if plate or chassis already exists
        const existing = await prisma.vehicles.findFirst({
            where: {
                OR: [
                    { plate_number: plate_number },
                    { chassis_number: chassis_number }
                ]
            }
        })
        
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Plate number or chassis number already exists'
            })
        }
        
        // Calculate next service
        const next_service_due = parseFloat(current_mileage) + 5000
        
        // Create vehicle
        const vehicle = await prisma.vehicles.create({
            data: {
                user_id: req.user.id,
                plate_number: plate_number,
                chassis_number: chassis_number,
                make: make,
                model: model,
                year: parseInt(year),
                color: color,
                current_mileage: parseFloat(current_mileage),
                next_service_due: next_service_due
            }
        })
        
        // Generate QR code
        const qrData = {
            vehicleId: vehicle.id,
            plateNumber: vehicle.plate_number,
            chassisNumber: vehicle.chassis_number,
            info: `${vehicle.make} ${vehicle.model} ${vehicle.year}`
        }
        
        const qrPath = `qrcodes/vehicle-${vehicle.id}-${Date.now()}.png`
        const fullPath = path.join(__dirname, '../public', qrPath)
        
        await fs.mkdir(path.dirname(fullPath), { recursive: true })
        
        await QRCode.toFile(fullPath, JSON.stringify(qrData), {
            width: 300,
            margin: 1
        })
        
        // Update vehicle with QR code path
        const updatedVehicle = await prisma.vehicles.update({
            where: { id: vehicle.id },
            data: { qr_code_path: `/${qrPath}` }
        })
        
        res.status(201).json({
            success: true,
            data: updatedVehicle
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
}

// @desc    Update vehicle
exports.updateVehicle = async (req, res) => {
    try {
        const { current_mileage, ...updateData } = req.body
        
        // Get current vehicle
        const vehicle = await prisma.vehicles.findUnique({
            where: { id: parseInt(req.params.id) }
        })
        
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            })
        }
        
        // Check ownership
        if (req.user.role !== 'admin' && vehicle.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            })
        }
        
        // If mileage updated, check if service is due
        if (current_mileage && current_mileage !== vehicle.current_mileage) {
            if (current_mileage >= vehicle.next_service_due) {
                // Service due - send notification
                const io = req.app.get('io')
                io.to(`user_${vehicle.user_id}`).emit('service-due', {
                    vehicleId: vehicle.id,
                    plateNumber: vehicle.plate_number,
                    currentMileage: current_mileage,
                    dueMileage: vehicle.next_service_due
                })
            }
        }
        
        // Update vehicle
        const updatedVehicle = await prisma.vehicles.update({
            where: { id: parseInt(req.params.id) },
            data: {
                ...updateData,
                ...(current_mileage && { current_mileage: parseFloat(current_mileage) })
            }
        })
        
        res.json({
            success: true,
            data: updatedVehicle
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
}

// @desc    Delete vehicle
exports.deleteVehicle = async (req, res) => {
    try {
        // Check if vehicle exists
        const vehicle = await prisma.vehicles.findUnique({
            where: { id: parseInt(req.params.id) }
        })
        
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            })
        }
        
        // Check ownership
        if (req.user.role !== 'admin' && vehicle.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            })
        }
        
        // Delete vehicle
        await prisma.vehicles.delete({
            where: { id: parseInt(req.params.id) }
        })
        
        // Delete QR code if exists
        if (vehicle.qr_code_path) {
            const qrPath = path.join(__dirname, '..', 'public', vehicle.qr_code_path)
            try {
                await fs.unlink(qrPath)
            } catch (err) {
                console.warn('Could not delete QR code:', err.message)
            }
        }
        
        res.json({
            success: true,
            message: 'Vehicle deleted successfully'
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
}

// @desc    Get vehicles due for service
exports.getDueForService = async (req, res) => {
    try {
        const vehicles = await prisma.vehicles.findMany({
            where: {
                OR: [
                    { current_mileage: { gte: prisma.vehicles.fields.next_service_due } },
                    { next_service_date: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }
                ],
                ...(req.user.role !== 'admin' && { user_id: req.user.id })
            },
            include: {
                users: {
                    select: { email: true, username: true }
                }
            },
            orderBy: { next_service_due: 'asc' }
        })
        
        res.json({
            success: true,
            count: vehicles.length,
            data: vehicles
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
}

// @desc    Get vehicle QR code
exports.getVehicleQR = async (req, res) => {
    try {
        const vehicle = await prisma.vehicles.findUnique({
            where: { id: parseInt(req.params.id) },
            select: { qr_code_path: true }
        })
        
        if (!vehicle || !vehicle.qr_code_path) {
            return res.status(404).json({
                success: false,
                message: 'QR code not found'
            })
        }
        
        res.json({
            success: true,
            qrCodeUrl: vehicle.qr_code_path
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
}

// Debug line
console.log('✅ vehicleController loaded with Prisma')