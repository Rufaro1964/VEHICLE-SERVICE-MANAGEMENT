const db = require('../config/db');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;

// @desc    Get all services
// @route   GET /api/services
exports.getAllServices = async (req, res) => {
    try {
        const { vehicle_id, start_date, end_date, status } = req.query;
        
        let query = `
            SELECT s.*, 
                   v.plate_number, 
                   v.make, 
                   v.model,
                   st.name as service_type_name,
                   u.username as technician_name
            FROM services s
            JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN service_types st ON s.service_type_id = st.id
            LEFT JOIN users u ON s.technician_id = u.id
            WHERE 1=1
        `;
        
        const params = [];
        
        // Filter by vehicle
        if (vehicle_id) {
            query += ' AND s.vehicle_id = ?';
            params.push(vehicle_id);
        }
        
        // Filter by status
        if (status) {
            query += ' AND s.status = ?';
            params.push(status);
        }
        
        // Filter by date range
        if (start_date) {
            query += ' AND s.service_date >= ?';
            params.push(start_date);
        }
        
        if (end_date) {
            query += ' AND s.service_date <= ?';
            params.push(end_date);
        }
        
        // User restriction (unless admin)
        if (req.user.role !== 'admin') {
            query += ' AND v.user_id = ?';
            params.push(req.user.id);
        }
        
        query += ' ORDER BY s.service_date DESC';
        
        const [services] = await db.query(query, params);
        
        res.json({
            success: true,
            count: services.length,
            data: services
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get service by ID
// @route   GET /api/services/:id
exports.getService = async (req, res) => {
    try {
        const query = `
            SELECT s.*, 
                   v.plate_number, 
                   v.make, 
                   v.model,
                   v.chassis_number,
                   st.name as service_type_name,
                   st.description as service_type_desc,
                   u.username as technician_name,
                   (SELECT JSON_ARRAYAGG(
                       JSON_OBJECT(
                           'id', sp.id,
                           'part_name', sp.part_name,
                           'part_number', sp.part_number,
                           'quantity', sp.quantity,
                           'unit_cost', sp.unit_cost,
                           'total_cost', sp.total_cost,
                           'warranty_months', sp.warranty_months,
                           'supplier', sp.supplier
                       )
                   ) FROM spare_parts sp WHERE sp.service_id = s.id) as spare_parts
            FROM services s
            JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN service_types st ON s.service_type_id = st.id
            LEFT JOIN users u ON s.technician_id = u.id
            WHERE s.id = ?
        `;
        
        const [services] = await db.query(query, [req.params.id]);
        
        if (services.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }
        
        res.json({
            success: true,
            data: services[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create service
// @route   POST /api/services
exports.createService = async (req, res) => {
    try {
        const {
            vehicle_id,
            service_type_id,
            service_date,
            mileage_at_service,
            total_cost,
            notes,
            spare_parts = [],
            technician_id = null
        } = req.body;
        
        // Generate invoice number
        const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Calculate next service due (5000 miles from current)
        const next_service_due = parseFloat(mileage_at_service) + 5000;
        const next_service_date = new Date();
        next_service_date.setMonth(next_service_date.getMonth() + 6); // 6 months from now
        
        // Start transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            // Create service
            const [serviceResult] = await connection.query(
                `INSERT INTO services 
                 (vehicle_id, service_type_id, service_date, mileage_at_service, 
                  total_cost, notes, next_service_due, next_service_date, 
                  invoice_number, technician_id, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
                [vehicle_id, service_type_id, service_date, mileage_at_service,
                 total_cost, notes, next_service_due, next_service_date,
                 invoiceNumber, technician_id]
            );
            
            const serviceId = serviceResult.insertId;
            
            // Add spare parts if any
            if (spare_parts.length > 0) {
                for (const part of spare_parts) {
                    await connection.query(
                        `INSERT INTO spare_parts 
                         (service_id, part_name, part_number, quantity, unit_cost, total_cost, warranty_months, supplier) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [serviceId, part.part_name, part.part_number, part.quantity,
                         part.unit_cost, part.total_cost, part.warranty_months, part.supplier]
                    );
                }
            }
            
            // Update vehicle mileage and next service
            await connection.query(
                `UPDATE vehicles 
                 SET current_mileage = ?, 
                     last_service_mileage = ?,
                     last_service_date = ?,
                     next_service_due = ?,
                     next_service_date = ?
                 WHERE id = ?`,
                [mileage_at_service, mileage_at_service, service_date,
                 next_service_due, next_service_date, vehicle_id]
            );
            
            // Commit transaction
            await connection.commit();
            connection.release();
            
            // Get created service
            const [services] = await db.query(
                'SELECT * FROM services WHERE id = ?',
                [serviceId]
            );
            
            // Send real-time notification
            const io = req.app.get('io');
            io.to(`user_${req.user.id}`).emit('service-completed', {
                serviceId: serviceId,
                invoiceNumber: invoiceNumber,
                vehicleId: vehicle_id,
                totalCost: total_cost
            });
            
            res.status(201).json({
                success: true,
                data: services[0]
            });
        } catch (err) {
            await connection.rollback();
            connection.release();
            throw err;
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update service
// @route   PUT /api/services/:id
exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Check if service exists
        const [services] = await db.query(
            'SELECT * FROM services WHERE id = ?',
            [id]
        );
        
        if (services.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }
        
        // Update service
        const updateFields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updateData), id];
        
        if (updateFields) {
            await db.query(
                `UPDATE services SET ${updateFields} WHERE id = ?`,
                values
            );
        }
        
        // Get updated service
        const [updatedServices] = await db.query(
            'SELECT * FROM services WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            data: updatedServices[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
exports.deleteService = async (req, res) => {
    try {
        // Check if service exists
        const [services] = await db.query(
            'SELECT * FROM services WHERE id = ?',
            [req.params.id]
        );
        
        if (services.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }
        
        // Delete service (cascade will delete spare parts)
        await db.query('DELETE FROM services WHERE id = ?', [req.params.id]);
        
        res.json({
            success: true,
            message: 'Service deleted successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get monthly service report
// @route   GET /api/services/report/:year/:month
exports.getMonthlyReport = async (req, res) => {
    try {
        const { year, month } = req.params;
        
        const query = `
            SELECT 
                DATE(s.service_date) as date,
                COUNT(*) as service_count,
                SUM(s.total_cost) as total_cost,
                GROUP_CONCAT(DISTINCT v.plate_number) as vehicles_serviced
            FROM services s
            JOIN vehicles v ON s.vehicle_id = v.id
            WHERE YEAR(s.service_date) = ? 
            AND MONTH(s.service_date) = ?
            ${req.user.role !== 'admin' ? 'AND v.user_id = ?' : ''}
            GROUP BY DATE(s.service_date)
            ORDER BY date
        `;
        
        const params = [year, month];
        if (req.user.role !== 'admin') {
            params.push(req.user.id);
        }
        
        const [dailySummary] = await db.query(query, params);
        
        // Get detailed services
        const detailQuery = `
            SELECT s.*, 
                   v.plate_number, 
                   v.make, 
                   v.model,
                   st.name as service_type,
                   u.username as technician
            FROM services s
            JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN service_types st ON s.service_type_id = st.id
            LEFT JOIN users u ON s.technician_id = u.id
            WHERE YEAR(s.service_date) = ? 
            AND MONTH(s.service_date) = ?
            ${req.user.role !== 'admin' ? 'AND v.user_id = ?' : ''}
            ORDER BY s.service_date DESC
        `;
        
        const [services] = await db.query(detailQuery, params);
        
        // Calculate totals
        const totals = dailySummary.reduce((acc, day) => {
            acc.service_count += day.service_count;
            acc.total_cost += parseFloat(day.total_cost || 0);
            return acc;
        }, { service_count: 0, total_cost: 0 });
        
        res.json({
            success: true,
            month: `${month}/${year}`,
            totals,
            daily_summary: dailySummary,
            services: services,
            vehicle_count: new Set(services.map(s => s.vehicle_id)).size
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get service types
// @route   GET /api/services/types
exports.getServiceTypes = async (req, res) => {
    try {
        const [serviceTypes] = await db.query(
            'SELECT * FROM service_types ORDER BY name'
        );
        
        res.json({
            success: true,
            data: serviceTypes
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Export services to Excel
// @route   GET /api/services/export/excel
exports.exportToExcel = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        // Get services
        const [services] = await db.query(
            `SELECT s.*, 
                    v.plate_number, 
                    v.make, 
                    v.model,
                    st.name as service_type
             FROM services s
             JOIN vehicles v ON s.vehicle_id = v.id
             LEFT JOIN service_types st ON s.service_type_id = st.id
             WHERE s.service_date BETWEEN ? AND ?
             ${req.user.role !== 'admin' ? 'AND v.user_id = ?' : ''}
             ORDER BY s.service_date DESC`,
            [start_date || '1900-01-01', end_date || '2100-12-31', ...(req.user.role !== 'admin' ? [req.user.id] : [])]
        );
        
        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Services');
        
        // Add headers
        worksheet.columns = [
            { header: 'Invoice #', key: 'invoice_number', width: 20 },
            { header: 'Date', key: 'service_date', width: 15 },
            { header: 'Vehicle Plate', key: 'plate_number', width: 15 },
            { header: 'Make/Model', key: 'make_model', width: 20 },
            { header: 'Service Type', key: 'service_type', width: 20 },
            { header: 'Mileage', key: 'mileage_at_service', width: 15 },
            { header: 'Cost', key: 'total_cost', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Notes', key: 'notes', width: 30 }
        ];
        
        // Add data
        services.forEach(service => {
            worksheet.addRow({
                invoice_number: service.invoice_number,
                service_date: new Date(service.service_date).toLocaleDateString(),
                plate_number: service.plate_number,
                make_model: `${service.make} ${service.model}`,
                service_type: service.service_type,
                mileage_at_service: service.mileage_at_service,
                total_cost: service.total_cost,
                status: service.status,
                notes: service.notes
            });
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
        
        // Add total row
        const totalRow = worksheet.rowCount + 1;
        worksheet.getCell(`G${totalRow}`).value = {
            formula: `SUM(G2:G${totalRow - 1})`
        };
        worksheet.getCell(`G${totalRow}`).numFmt = '$#,##0.00';
        worksheet.getCell(`F${totalRow}`).value = 'Total:';
        worksheet.getCell(`F${totalRow}`).font = { bold: true };
        
        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=services-${Date.now()}.xlsx`
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