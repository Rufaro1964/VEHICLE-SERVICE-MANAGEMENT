const db = require('../config/db');
const ExcelJS = require('exceljs');

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.role !== 'admin' ? req.user.id : null;
        
        // Get vehicle count
        const vehicleQuery = userId 
            ? 'SELECT COUNT(*) as count FROM vehicles WHERE user_id = ?'
            : 'SELECT COUNT(*) as count FROM vehicles';
        const vehicleParams = userId ? [userId] : [];
        const [[vehicleCount]] = await db.query(vehicleQuery, vehicleParams);
        
        // Get service count (last 30 days)
        const serviceQuery = userId
            ? `SELECT COUNT(*) as count FROM services s 
               JOIN vehicles v ON s.vehicle_id = v.id 
               WHERE s.service_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
               AND v.user_id = ?`
            : `SELECT COUNT(*) as count FROM services 
               WHERE service_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
        const serviceParams = userId ? [userId] : [];
        const [[serviceCount]] = await db.query(serviceQuery, serviceParams);
        
        // Get total cost (last 30 days)
        const costQuery = userId
            ? `SELECT COALESCE(SUM(total_cost), 0) as total FROM services s 
               JOIN vehicles v ON s.vehicle_id = v.id 
               WHERE s.service_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
               AND v.user_id = ?`
            : `SELECT COALESCE(SUM(total_cost), 0) as total FROM services 
               WHERE service_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
        const [[costResult]] = await db.query(costQuery, serviceParams);
        
        // Get due for service count
        const dueQuery = userId
            ? `SELECT COUNT(*) as count FROM vehicles 
               WHERE (current_mileage >= next_service_due 
               OR next_service_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)) 
               AND user_id = ?`
            : `SELECT COUNT(*) as count FROM vehicles 
               WHERE current_mileage >= next_service_due 
               OR next_service_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)`;
        const [[dueCount]] = await db.query(dueQuery, vehicleParams);
        
        // Get monthly service trend
        const trendQuery = userId
            ? `SELECT 
                   DATE_FORMAT(s.service_date, '%Y-%m') as month,
                   COUNT(*) as service_count,
                   SUM(s.total_cost) as total_cost
               FROM services s
               JOIN vehicles v ON s.vehicle_id = v.id
               WHERE s.service_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
               AND v.user_id = ?
               GROUP BY DATE_FORMAT(s.service_date, '%Y-%m')
               ORDER BY month`
            : `SELECT 
                   DATE_FORMAT(service_date, '%Y-%m') as month,
                   COUNT(*) as service_count,
                   SUM(total_cost) as total_cost
               FROM services
               WHERE service_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
               GROUP BY DATE_FORMAT(service_date, '%Y-%m')
               ORDER BY month`;
        const [monthlyTrend] = await db.query(trendQuery, vehicleParams);
        
        // Get popular service types
        const popularQuery = userId
            ? `SELECT 
                   st.name as service_type,
                   COUNT(*) as count,
                   AVG(s.total_cost) as avg_cost
               FROM services s
               JOIN vehicles v ON s.vehicle_id = v.id
               JOIN service_types st ON s.service_type_id = st.id
               WHERE v.user_id = ?
               GROUP BY st.name
               ORDER BY count DESC
               LIMIT 5`
            : `SELECT 
                   st.name as service_type,
                   COUNT(*) as count,
                   AVG(s.total_cost) as avg_cost
               FROM services s
               JOIN service_types st ON s.service_type_id = st.id
               GROUP BY st.name
               ORDER BY count DESC
               LIMIT 5`;
        const [popularServices] = await db.query(popularQuery, vehicleParams);
        
        res.json({
            success: true,
            data: {
                vehicles: vehicleCount.count,
                recent_services: serviceCount.count,
                recent_cost: parseFloat(costResult.total || 0),
                due_for_service: dueCount.count,
                monthly_trend: monthlyTrend,
                popular_services: popularServices
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get financial report
// @route   GET /api/reports/financial
exports.getFinancialReport = async (req, res) => {
    try {
        const { year } = req.query;
        const userId = req.user.role !== 'admin' ? req.user.id : null;
        
        const query = userId
            ? `SELECT 
                   DATE_FORMAT(s.service_date, '%Y-%m') as month,
                   COUNT(*) as service_count,
                   SUM(s.total_cost) as revenue,
                   AVG(s.total_cost) as avg_service_cost,
                   MIN(s.total_cost) as min_service_cost,
                   MAX(s.total_cost) as max_service_cost
               FROM services s
               JOIN vehicles v ON s.vehicle_id = v.id
               WHERE YEAR(s.service_date) = ?
               AND v.user_id = ?
               GROUP BY DATE_FORMAT(s.service_date, '%Y-%m')
               ORDER BY month`
            : `SELECT 
                   DATE_FORMAT(service_date, '%Y-%m') as month,
                   COUNT(*) as service_count,
                   SUM(total_cost) as revenue,
                   AVG(total_cost) as avg_service_cost,
                   MIN(total_cost) as min_service_cost,
                   MAX(total_cost) as max_service_cost
               FROM services
               WHERE YEAR(service_date) = ?
               GROUP BY DATE_FORMAT(service_date, '%Y-%m')
               ORDER BY month`;
        
        const params = [year || new Date().getFullYear()];
        if (userId) params.push(userId);
        
        const [monthlyData] = await db.query(query, params);
        
        // Calculate totals
        const totals = monthlyData.reduce((acc, month) => {
            acc.service_count += month.service_count;
            acc.revenue += parseFloat(month.revenue || 0);
            return acc;
        }, { service_count: 0, revenue: 0 });
        
        res.json({
            success: true,
            year: year || new Date().getFullYear(),
            totals,
            monthly_data: monthlyData
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Export vehicles to Excel
// @route   GET /api/reports/export/vehicles
exports.exportVehiclesToExcel = async (req, res) => {
    try {
        const userId = req.user.role !== 'admin' ? req.user.id : null;
        
        const query = userId
            ? `SELECT 
                   plate_number,
                   chassis_number,
                   make,
                   model,
                   year,
                   color,
                   current_mileage,
                   last_service_date,
                   next_service_due,
                   next_service_date,
                   created_at
               FROM vehicles
               WHERE user_id = ?
               ORDER BY plate_number`
            : `SELECT 
                   v.plate_number,
                   v.chassis_number,
                   v.make,
                   v.model,
                   v.year,
                   v.color,
                   v.current_mileage,
                   v.last_service_date,
                   v.next_service_due,
                   v.next_service_date,
                   v.created_at,
                   u.username as owner
               FROM vehicles v
               LEFT JOIN users u ON v.user_id = u.id
               ORDER BY v.plate_number`;
        
        const [vehicles] = await db.query(query, userId ? [userId] : []);
        
        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Vehicles');
        
        // Add headers
        const headers = userId
            ? [
                'Plate Number', 'Chassis Number', 'Make', 'Model', 'Year',
                'Color', 'Current Mileage', 'Last Service', 'Next Service Due',
                'Next Service Date', 'Created Date'
            ]
            : [
                'Plate Number', 'Chassis Number', 'Make', 'Model', 'Year',
                'Color', 'Current Mileage', 'Last Service', 'Next Service Due',
                'Next Service Date', 'Owner', 'Created Date'
            ];
        
        worksheet.addRow(headers);
        
        // Add data
        vehicles.forEach(vehicle => {
            const row = userId
                ? [
                    vehicle.plate_number,
                    vehicle.chassis_number,
                    vehicle.make,
                    vehicle.model,
                    vehicle.year,
                    vehicle.color,
                    vehicle.current_mileage,
                    vehicle.last_service_date ? new Date(vehicle.last_service_date).toLocaleDateString() : 'Never',
                    vehicle.next_service_due,
                    vehicle.next_service_date ? new Date(vehicle.next_service_date).toLocaleDateString() : 'N/A',
                    new Date(vehicle.created_at).toLocaleDateString()
                ]
                : [
                    vehicle.plate_number,
                    vehicle.chassis_number,
                    vehicle.make,
                    vehicle.model,
                    vehicle.year,
                    vehicle.color,
                    vehicle.current_mileage,
                    vehicle.last_service_date ? new Date(vehicle.last_service_date).toLocaleDateString() : 'Never',
                    vehicle.next_service_due,
                    vehicle.next_service_date ? new Date(vehicle.next_service_date).toLocaleDateString() : 'N/A',
                    vehicle.owner,
                    new Date(vehicle.created_at).toLocaleDateString()
                ];
            worksheet.addRow(row);
        });
        
        // Style headers
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
        });
        
        // Auto-size columns
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                const columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) {
                    maxLength = columnLength;
                }
            });
            column.width = Math.min(maxLength + 2, 30);
        });
        
        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=vehicles-${Date.now()}.xlsx`
        );
        
        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Error generating Excel file'
        });
    }
};

// @desc    Import vehicles from Excel
// @route   POST /api/reports/import/vehicles
exports.importVehiclesFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);
        const worksheet = workbook.getWorksheet(1);
        
        const vehicles = [];
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber > 1) { // Skip header
                try {
                    const vehicle = {
                        plate_number: row.getCell(1).value?.toString().trim(),
                        chassis_number: row.getCell(2).value?.toString().trim(),
                        make: row.getCell(3).value?.toString().trim(),
                        model: row.getCell(4).value?.toString().trim(),
                        year: row.getCell(5).value,
                        color: row.getCell(6).value?.toString().trim(),
                        current_mileage: row.getCell(7).value || 0
                    };
                    
                    if (vehicle.plate_number && vehicle.chassis_number) {
                        vehicles.push(vehicle);
                        successCount++;
                    } else {
                        errors.push(`Row ${rowNumber}: Missing required fields`);
                        errorCount++;
                    }
                } catch (err) {
                    errors.push(`Row ${rowNumber}: ${err.message}`);
                    errorCount++;
                }
            }
        });
        
        // Insert vehicles into database
        const inserted = [];
        for (const vehicle of vehicles) {
            try {
                // Check if vehicle already exists
                const [existing] = await db.query(
                    'SELECT id FROM vehicles WHERE plate_number = ? OR chassis_number = ?',
                    [vehicle.plate_number, vehicle.chassis_number]
                );
                
                if (existing.length === 0) {
                    const next_service_due = (vehicle.current_mileage || 0) + 5000;
                    
                    const [result] = await db.query(
                        `INSERT INTO vehicles 
                         (user_id, plate_number, chassis_number, make, model, year, color, current_mileage, next_service_due) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [req.user.id, vehicle.plate_number, vehicle.chassis_number, vehicle.make,
                         vehicle.model, vehicle.year, vehicle.color, vehicle.current_mileage, next_service_due]
                    );
                    
                    inserted.push({
                        id: result.insertId,
                        ...vehicle
                    });
                } else {
                    errors.push(`Vehicle ${vehicle.plate_number} already exists`);
                    errorCount++;
                }
            } catch (err) {
                errors.push(`Error inserting ${vehicle.plate_number}: ${err.message}`);
                errorCount++;
            }
        }
        
        // Clean up uploaded file
        const fs = require('fs');
        fs.unlinkSync(req.file.path);
        
        res.json({
            success: true,
            message: `Import completed: ${successCount} processed, ${inserted.length} inserted, ${errorCount} errors`,
            imported: inserted,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Error importing Excel file'
        });
    }
};