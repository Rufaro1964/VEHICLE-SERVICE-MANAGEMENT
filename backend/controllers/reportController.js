// controllers/reportController.js
const prisma = require('../lib/prisma');
const ExcelJS = require('exceljs');

// @desc    Get all reports (summary)
// @route   GET /api/reports
exports.getAllReports = async (req, res) => {
    try {
        const where = req.user.role !== 'ADMIN' ? { userId: req.user.id } : {};
        
        // Get counts
        const [
            vehicleCount,
            serviceCount,
            totalServiceCost,
            upcomingServiceCount
        ] = await Promise.all([
            prisma.vehicle.count({ where }),
            prisma.service.count({ 
                where: { 
                    vehicle: where 
                } 
            }),
            prisma.service.aggregate({
                where: { 
                    vehicle: where,
                    status: 'COMPLETED' 
                },
                _sum: { totalCost: true }
            }),
            prisma.vehicle.count({
                where: {
                    ...where,
                    OR: [
                        { currentMileage: { gte: prisma.vehicle.fields.nextServiceDue } },
                        { nextServiceDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }
                    ]
                }
            })
        ]);
        
        // Get recent activities
        const recentServices = await prisma.service.findMany({
            where: { vehicle: where },
            take: 10,
            orderBy: { serviceDate: 'desc' },
            include: {
                vehicle: { select: { plateNumber: true } },
                serviceType: { select: { name: true } }
            }
        });
        
        res.json({
            success: true,
            data: {
                summary: {
                    total_vehicles: vehicleCount,
                    total_services: serviceCount,
                    total_service_cost: totalServiceCost._sum.totalCost || 0,
                    upcoming_services: upcomingServiceCount
                },
                recent_activities: recentServices,
                generated_at: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('Get all reports error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get vehicle reports
// @route   GET /api/reports/vehicles
exports.getVehicleReports = async (req, res) => {
    try {
        const where = req.user.role !== 'ADMIN' ? { userId: req.user.id } : {};
        
        // Get vehicles with service stats
        const vehicles = await prisma.vehicle.findMany({
            where,
            include: {
                _count: {
                    select: { services: true }
                },
                services: {
                    take: 1,
                    orderBy: { serviceDate: 'desc' },
                    select: { serviceDate: true, totalCost: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        
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
            if (vehicle.currentMileage >= vehicle.nextServiceDue ||
                (vehicle.nextServiceDate && vehicle.nextServiceDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))) {
                stats.service_due_count++;
            }
            
            totalMileage += vehicle.currentMileage;
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
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get service reports
// @route   GET /api/reports/services
exports.getServiceReports = async (req, res) => {
    try {
        const { start_date, end_date, vehicle_id, service_type_id } = req.query;
        
        let where = {};
        
        // Date filter
        if (start_date || end_date) {
            where.serviceDate = {};
            if (start_date) where.serviceDate.gte = new Date(start_date);
            if (end_date) where.serviceDate.lte = new Date(end_date);
        }
        
        // Vehicle filter
        if (vehicle_id) where.vehicleId = parseInt(vehicle_id);
        
        // Service type filter
        if (service_type_id) where.serviceTypeId = parseInt(service_type_id);
        
        // User restriction
        if (req.user.role !== 'ADMIN') {
            where.vehicle = { userId: req.user.id };
        }
        
        // Get services with related data
        const services = await prisma.service.findMany({
            where,
            include: {
                vehicle: {
                    select: { plateNumber: true, make: true, model: true }
                },
                serviceType: {
                    select: { name: true }
                },
                technician: {
                    select: { username: true }
                },
                spareParts: true
            },
            orderBy: { serviceDate: 'desc' }
        });
        
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
            totalCost += parseFloat(service.totalCost || 0);
            
            // Count by status
            stats.by_status[service.status] = (stats.by_status[service.status] || 0) + 1;
            
            // Count by month
            const month = service.serviceDate.toISOString().slice(0, 7); // YYYY-MM
            stats.by_month[month] = (stats.by_month[month] || 0) + 1;
            
            // Count by service type
            const serviceTypeName = service.serviceType?.name || 'Unknown';
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
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get financial reports
// @route   GET /api/reports/financial
exports.getFinancialReports = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        let where = { status: 'COMPLETED' };
        
        // Date filter
        if (start_date || end_date) {
            where.serviceDate = {};
            if (start_date) where.serviceDate.gte = new Date(start_date);
            if (end_date) where.serviceDate.lte = new Date(end_date);
        }
        
        // User restriction
        if (req.user.role !== 'ADMIN') {
            where.vehicle = { userId: req.user.id };
        }
        
        // Get services for financial data
        const services = await prisma.service.findMany({
            where,
            include: {
                vehicle: {
                    select: { plateNumber: true }
                },
                serviceType: {
                    select: { name: true }
                },
                spareParts: true
            },
            orderBy: { serviceDate: 'desc' }
        });
        
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
            const revenue = parseFloat(service.totalCost || 0);
            financialData.total_revenue += revenue;
            
            // Calculate parts cost
            const partsCost = service.spareParts.reduce((sum, part) => 
                sum + (parseFloat(part.totalCost) || 0), 0
            );
            financialData.total_parts_cost += partsCost;
            
            // Calculate labor cost (revenue - parts cost)
            const laborCost = revenue - partsCost;
            financialData.total_labor_cost += laborCost;
            
            // Monthly revenue
            const month = service.serviceDate.toISOString().slice(0, 7); // YYYY-MM
            financialData.monthly_revenue[month] = 
                (financialData.monthly_revenue[month] || 0) + revenue;
            
            // Revenue by vehicle
            const vehicleKey = service.vehicle.plateNumber;
            financialData.revenue_by_vehicle[vehicleKey] = 
                (financialData.revenue_by_vehicle[vehicleKey] || 0) + revenue;
            
            // Revenue by service type
            const serviceType = service.serviceType?.name || 'Unknown';
            financialData.revenue_by_service_type[serviceType] = 
                (financialData.revenue_by_service_type[serviceType] || 0) + revenue;
        });
        
        // Calculate profit (simplified)
        financialData.gross_profit = financialData.total_revenue - financialData.total_parts_cost;
        financialData.profit_margin = financialData.total_revenue > 0 ? 
            (financialData.gross_profit / financialData.total_revenue) * 100 : 0;
        
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
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Export reports to Excel
// @route   GET /api/reports/export/excel
exports.exportReportsToExcel = async (req, res) => {
    try {
        const { report_type = 'services', start_date, end_date } = req.query;
        
        let data = [];
        let worksheetName = 'Report';
        
        // Fetch data based on report type
        switch(report_type) {
            case 'vehicles':
                worksheetName = 'Vehicles Report';
                const vehicles = await prisma.vehicle.findMany({
                    where: req.user.role !== 'ADMIN' ? { userId: req.user.id } : {},
                    include: {
                        owner: { select: { username: true } },
                        _count: { select: { services: true } }
                    }
                });
                data = vehicles.map(v => ({
                    'Plate Number': v.plateNumber,
                    'Chassis Number': v.chassisNumber,
                    'Make/Model': `${v.make} ${v.model}`,
                    'Year': v.year,
                    'Color': v.color,
                    'Current Mileage': v.currentMileage,
                    'Next Service Due': v.nextServiceDue,
                    'Service Count': v._count.services,
                    'Owner': v.owner.username,
                    'Created Date': v.createdAt.toISOString().split('T')[0]
                }));
                break;
                
            case 'services':
                worksheetName = 'Services Report';
                let where = {};
                if (start_date || end_date) {
                    where.serviceDate = {};
                    if (start_date) where.serviceDate.gte = new Date(start_date);
                    if (end_date) where.serviceDate.lte = new Date(end_date);
                }
                if (req.user.role !== 'ADMIN') {
                    where.vehicle = { userId: req.user.id };
                }
                
                const services = await prisma.service.findMany({
                    where,
                    include: {
                        vehicle: { select: { plateNumber: true, make: true, model: true } },
                        serviceType: { select: { name: true } }
                    }
                });
                data = services.map(s => ({
                    'Invoice #': s.invoiceNumber,
                    'Service Date': s.serviceDate.toISOString().split('T')[0],
                    'Vehicle Plate': s.vehicle.plateNumber,
                    'Make/Model': `${s.vehicle.make} ${s.vehicle.model}`,
                    'Service Type': s.serviceType?.name || 'N/A',
                    'Mileage': s.mileageAtService,
                    'Total Cost': s.totalCost,
                    'Status': s.status,
                    'Notes': s.notes,
                    'Next Service Due': s.nextServiceDue
                }));
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid report type. Use "vehicles" or "services"'
                });
        }
        
        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(worksheetName);
        
        // Add headers
        if (data.length > 0) {
            const headers = Object.keys(data[0]);
            worksheet.columns = headers.map(header => ({
                header: header,
                key: header,
                width: 20
            }));
            
            // Add data
            data.forEach(row => {
                worksheet.addRow(row);
            });
            
            // Style headers
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF0070C0' }
                };
                cell.alignment = { horizontal: 'center' };
            });
            
            // Add totals row for numeric columns
            if (report_type === 'services') {
                const totalRow = worksheet.rowCount + 1;
                worksheet.getCell(`G${totalRow}`).value = {
                    formula: `SUM(G2:G${totalRow - 1})`
                };
                worksheet.getCell(`G${totalRow}`).numFmt = '$#,##0.00';
                worksheet.getCell(`F${totalRow}`).value = 'Total Cost:';
                worksheet.getCell(`F${totalRow}`).font = { bold: true };
            }
        }
        
        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${report_type}-report-${Date.now()}.xlsx`
        );
        
        // Write to response
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (err) {
        console.error('Export to Excel error:', err);
        res.status(500).json({
            success: false,
            message: 'Error generating Excel file'
        });
    }
};