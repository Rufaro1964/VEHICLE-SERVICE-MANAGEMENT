// controllers/reportController.js
const prisma = require('../lib/prisma');
const ExcelJS = require('exceljs');

// @desc    Get all reports (summary)
// @route   GET /api/reports
exports.getAllReports = async (req, res) => {
    try {
        console.log('Getting all reports for user:', req.user.id);
        
        const where = req.user.role !== 'ADMIN' ? { user_id: req.user.id } : {};
        
        // Get counts
        const [
            vehicleCount,
            serviceCount,
            totalServiceCost,
            upcomingServiceCount
        ] = await Promise.all([
            prisma.vehicles.count({ where }),
            prisma.services.count({ 
                where: { 
                    vehicles: where 
                } 
            }),
            prisma.services.aggregate({
                where: { 
                    vehicles: where,
                    status: 'completed' 
                },
                _sum: { total_cost: true }
            }),
            prisma.vehicles.count({
                where: {
                    ...where,
                    OR: [
                        { current_mileage: { gte: prisma.vehicles.fields.next_service_due } },
                        { next_service_date: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }
                    ]
                }
            })
        ]);
        
        // Get recent activities
        const recentServices = await prisma.services.findMany({
            where: { vehicles: where },
            take: 10,
            orderBy: { service_date: 'desc' },
            include: {
                vehicles: { select: { plate_number: true } },
                service_types: { select: { name: true } }
            }
        });
        
        res.json({
            success: true,
            data: {
                summary: {
                    total_vehicles: vehicleCount,
                    total_services: serviceCount,
                    total_service_cost: totalServiceCost._sum.total_cost || 0,
                    upcoming_services: upcomingServiceCount
                },
                recent_activities: recentServices,
                generated_at: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('Get all reports error:', err);
        console.error('Error details:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Get vehicle reports
// @route   GET /api/reports/vehicles
exports.getVehicleReports = async (req, res) => {
    try {
        console.log('Getting vehicle reports for user:', req.user.id);
        
        const where = req.user.role !== 'ADMIN' ? { user_id: req.user.id } : {};
        
        // Get vehicles with service stats
        const vehicles = await prisma.vehicles.findMany({
            where,
            include: {
                _count: {
                    select: { services: true }
                },
                services: {
                    take: 1,
                    orderBy: { service_date: 'desc' },
                    select: { service_date: true, total_cost: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });
        
        console.log(`Found ${vehicles.length} vehicles`);
        
        // Calculate statistics
        const stats = {
            total: vehicles.length,
            by_make: {},
            by_year: {},
            service_due_count: 0,
            average_mileage: 0
        };
        
        let totalMileage = 0;
        
        vehicles.forEach(vehicle => {
            // Count by make
            stats.by_make[vehicle.make] = (stats.by_make[vehicle.make] || 0) + 1;
            
            // Count by year
            stats.by_year[vehicle.year] = (stats.by_year[vehicle.year] || 0) + 1;
            
            // Check if service due
            if (vehicle.current_mileage >= vehicle.next_service_due ||
                (vehicle.next_service_date && vehicle.next_service_date <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))) {
                stats.service_due_count++;
            }
            
            totalMileage += vehicle.current_mileage;
        });
        
        stats.average_mileage = vehicles.length > 0 ? totalMileage / vehicles.length : 0;
        
        res.json({
            success: true,
            data: {
                vehicles,
                statistics: stats,
                generated_at: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('Vehicle reports error:', err);
        console.error('Error details:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Get service reports
// @route   GET /api/reports/services
exports.getServiceReports = async (req, res) => {
    try {
        console.log('Getting service reports for user:', req.user.id);
        console.log('Query params:', req.query);
        
        const { start_date, end_date, vehicle_id, service_type_id } = req.query;
        
        let where = {};
        
        // Date filter
        if (start_date || end_date) {
            where.service_date = {};
            if (start_date) where.service_date.gte = new Date(start_date);
            if (end_date) where.service_date.lte = new Date(end_date);
        }
        
        // Vehicle filter
        if (vehicle_id) where.vehicle_id = parseInt(vehicle_id);
        
        // Service type filter
        if (service_type_id) where.service_type_id = parseInt(service_type_id);
        
        // User restriction
        if (req.user.role !== 'ADMIN') {
            where.vehicles = { user_id: req.user.id };
        }
        
        // Get services with related data
        const services = await prisma.services.findMany({
            where,
            include: {
                vehicles: {
                    select: { plate_number: true, make: true, model: true }
                },
                service_types: {
                    select: { name: true }
                },
                users: {
                    select: { username: true }
                },
                spare_parts: true
            },
            orderBy: { service_date: 'desc' }
        });
        
        console.log(`Found ${services.length} services`);
        
        // Calculate statistics
        const stats = {
            total_services: services.length,
            total_cost: 0,
            average_cost: 0,
            by_status: {},
            by_month: {},
            by_service_type: {}
        };
        
        let totalCost = 0;
        
        services.forEach(service => {
            totalCost += parseFloat(service.total_cost || 0);
            
            // Count by status
            stats.by_status[service.status] = (stats.by_status[service.status] || 0) + 1;
            
            // Count by month
            const month = service.service_date.toISOString().slice(0, 7); // YYYY-MM
            stats.by_month[month] = (stats.by_month[month] || 0) + 1;
            
            // Count by service type
            const serviceTypeName = service.service_types?.name || 'Unknown';
            stats.by_service_type[serviceTypeName] = (stats.by_service_type[serviceTypeName] || 0) + 1;
        });
        
        stats.total_cost = totalCost;
        stats.average_cost = services.length > 0 ? totalCost / services.length : 0;
        
        res.json({
            success: true,
            data: {
                services,
                statistics: stats,
                generated_at: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('Service reports error:', err);
        console.error('Error details:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Get financial reports
// @route   GET /api/reports/financial
exports.getFinancialReports = async (req, res) => {
    try {
        console.log('Getting financial reports for user:', req.user.id);
        console.log('Query params:', req.query);
        
        const { start_date, end_date } = req.query;
        
        let where = { status: 'completed' };
        
        // Date filter
        if (start_date || end_date) {
            where.service_date = {};
            if (start_date) where.service_date.gte = new Date(start_date);
            if (end_date) where.service_date.lte = new Date(end_date);
        }
        
        // User restriction
        if (req.user.role !== 'ADMIN') {
            where.vehicles = { user_id: req.user.id };
        }
        
        console.log('Where clause for services:', JSON.stringify(where, null, 2));
        
        // Get services for financial data
        const services = await prisma.services.findMany({
            where,
            include: {
                vehicles: {
                    select: { plate_number: true }
                },
                service_types: {
                    select: { name: true }
                },
                spare_parts: true
            },
            orderBy: { service_date: 'desc' }
        });
        
        console.log(`Found ${services.length} completed services for financial report`);
        
        // Calculate financial data
        const financialData = {
            total_revenue: 0,
            total_parts_cost: 0,
            total_labor_cost: 0,
            monthly_revenue: {},
            revenue_by_vehicle: {},
            revenue_by_service_type: {}
        };
        
        services.forEach(service => {
            const revenue = parseFloat(service.total_cost || 0);
            financialData.total_revenue += revenue;
            
            // Calculate parts cost (handle undefined spare_parts)
            const partsCost = Array.isArray(service.spare_parts) 
                ? service.spare_parts.reduce((sum, part) => 
                    sum + (parseFloat(part.total_cost) || 0), 0
                  )
                : 0;
            financialData.total_parts_cost += partsCost;
            
            // Calculate labor cost (revenue - parts cost)
            const laborCost = revenue - partsCost;
            financialData.total_labor_cost += laborCost;
            
            // Monthly revenue
            const month = service.service_date.toISOString().slice(0, 7); // YYYY-MM
            financialData.monthly_revenue[month] = 
                (financialData.monthly_revenue[month] || 0) + revenue;
            
            // Revenue by vehicle
            const vehicleKey = service.vehicles?.plate_number || `Vehicle_${service.vehicle_id}`;
            financialData.revenue_by_vehicle[vehicleKey] = 
                (financialData.revenue_by_vehicle[vehicleKey] || 0) + revenue;
            
            // Revenue by service type
            const serviceType = service.service_types?.name || 'Unknown';
            financialData.revenue_by_service_type[serviceType] = 
                (financialData.revenue_by_service_type[serviceType] || 0) + revenue;
        });
        
        // Calculate profit (simplified)
        financialData.gross_profit = financialData.total_revenue - financialData.total_parts_cost;
        financialData.profit_margin = financialData.total_revenue > 0 ? 
            (financialData.gross_profit / financialData.total_revenue) * 100 : 0;
        
        console.log('Financial data calculated:', financialData);
        
        res.json({
            success: true,
            data: {
                summary: financialData,
                detailed_services: services,
                generated_at: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('Financial reports error:', err);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// ... (keep the rest of your reportController.js functions with similar fixes)

module.exports = exports;