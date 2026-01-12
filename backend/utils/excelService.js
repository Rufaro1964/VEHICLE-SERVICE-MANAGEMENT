// backend/utils/excelService.js
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

class ExcelService {
    async exportVehiclesToExcel(vehicles) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Vehicles');
        
        // Add headers
        worksheet.columns = [
            { header: 'Plate Number', key: 'plate_number', width: 20 },
            { header: 'Chassis Number', key: 'chassis_number', width: 25 },
            { header: 'Make', key: 'make', width: 15 },
            { header: 'Model', key: 'model', width: 15 },
            { header: 'Year', key: 'year', width: 10 },
            { header: 'Color', key: 'color', width: 15 },
            { header: 'Current Mileage', key: 'current_mileage', width: 15 },
            { header: 'Last Service Date', key: 'last_service_date', width: 20 },
            { header: 'Next Service Due', key: 'next_service_due', width: 15 }
        ];
        
        // Add data
        vehicles.forEach(vehicle => {
            worksheet.addRow(vehicle);
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
        
        const filename = `vehicles-export-${Date.now()}.xlsx`;
        const filepath = path.join(__dirname, '../uploads/exports', filename);
        
        // Ensure directory exists
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
        
        await workbook.xlsx.writeFile(filepath);
        return filename;
    }

    async importVehiclesFromExcel(filepath) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filepath);
        const worksheet = workbook.getWorksheet(1);
        
        const vehicles = [];
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber > 1) { // Skip header row
                const vehicle = {
                    plate_number: row.getCell(1).value,
                    chassis_number: row.getCell(2).value,
                    make: row.getCell(3).value,
                    model: row.getCell(4).value,
                    year: row.getCell(5).value,
                    color: row.getCell(6).value,
                    current_mileage: row.getCell(7).value,
                    last_service_date: row.getCell(8).value,
                    next_service_due: row.getCell(9).value
                };
                vehicles.push(vehicle);
            }
        });
        
        return vehicles;
    }

    async exportServicesToExcel(services) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Services');
        
        worksheet.columns = [
            { header: 'Invoice #', key: 'invoice_number', width: 20 },
            { header: 'Plate Number', key: 'plate_number', width: 15 },
            { header: 'Service Date', key: 'service_date', width: 15 },
            { header: 'Service Type', key: 'service_type', width: 20 },
            { header: 'Mileage', key: 'mileage_at_service', width: 15 },
            { header: 'Total Cost', key: 'total_cost', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Technician', key: 'technician', width: 20 },
            { header: 'Notes', key: 'notes', width: 30 }
        ];
        
        services.forEach(service => {
            worksheet.addRow(service);
        });
        
        // Add formulas for totals
        const lastRow = worksheet.rowCount + 1;
        worksheet.getCell(`F${lastRow}`).value = {
            formula: `SUM(F2:F${lastRow - 1})`,
            result: services.reduce((sum, s) => sum + s.total_cost, 0)
        };
        worksheet.getCell(`F${lastRow}`).numFmt = '$#,##0.00';
        worksheet.getCell(`E${lastRow}`).value = 'Total:';
        worksheet.getCell(`E${lastRow}`).font = { bold: true };
        
        const filename = `services-export-${Date.now()}.xlsx`;
        const filepath = path.join(__dirname, '../uploads/exports', filename);
        
        await workbook.xlsx.writeFile(filepath);
        return filename;
    }
}

module.exports = new ExcelService();
