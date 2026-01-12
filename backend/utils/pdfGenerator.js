// backend/utils/pdfGenerator.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
    generateServiceReport(service, vehicle, serviceType, spareParts = []) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const filename = `service-report-${service.invoice_number}.pdf`;
            const filepath = path.join(__dirname, '../uploads/reports', filename);
            
            // Ensure directory exists
            fs.mkdirSync(path.dirname(filepath), { recursive: true });
            
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);
            
            // Header
            doc.fontSize(20).text('SERVICE REPORT', { align: 'center' });
            doc.moveDown();
            
            // Company Info
            doc.fontSize(12)
                .text('Vehicle Service Management System', { align: 'center' })
                .text('123 Service Street, City, Country', { align: 'center' })
                .text('Phone: (123) 456-7890 | Email: info@vehicleservice.com', { align: 'center' });
            
            doc.moveDown(2);
            
            // Invoice Details
            doc.fontSize(14).text('Invoice Details', { underline: true });
            doc.fontSize(10)
                .text(`Invoice Number: ${service.invoice_number}`)
                .text(`Date: ${new Date(service.service_date).toLocaleDateString()}`)
                .text(`Status: ${service.status}`);
            
            doc.moveDown();
            
            // Vehicle Information
            doc.fontSize(14).text('Vehicle Information', { underline: true });
            doc.fontSize(10)
                .text(`Plate Number: ${vehicle.plate_number}`)
                .text(`Chassis: ${vehicle.chassis_number}`)
                .text(`Make/Model: ${vehicle.make} ${vehicle.model}`)
                .text(`Mileage: ${service.mileage_at_service}`);
            
            doc.moveDown();
            
            // Service Details
            doc.fontSize(14).text('Service Details', { underline: true });
            doc.fontSize(10)
                .text(`Service Type: ${serviceType.name}`)
                .text(`Total Cost: $${service.total_cost.toFixed(2)}`)
                .text(`Next Service Due: ${service.next_service_due} miles`);
            
            doc.moveDown();
            
            // Spare Parts Table
            if (spareParts.length > 0) {
                doc.fontSize(14).text('Spare Parts Used', { underline: true });
                
                const tableTop = doc.y + 10;
                const itemCodeX = 50;
                const descriptionX = 150;
                const quantityX = 350;
                const priceX = 400;
                const totalX = 450;
                
                // Table Headers
                doc.font('Helvetica-Bold')
                    .fontSize(10)
                    .text('Part #', itemCodeX, tableTop)
                    .text('Description', descriptionX, tableTop)
                    .text('Qty', quantityX, tableTop)
                    .text('Price', priceX, tableTop)
                    .text('Total', totalX, tableTop);
                
                doc.font('Helvetica');
                let y = tableTop + 20;
                
                // Table Rows
                spareParts.forEach((part, i) => {
                    doc.fontSize(10)
                        .text(part.part_number || 'N/A', itemCodeX, y)
                        .text(part.part_name, descriptionX, y)
                        .text(part.quantity, quantityX, y)
                        .text(`$${part.unit_cost.toFixed(2)}`, priceX, y)
                        .text(`$${part.total_cost.toFixed(2)}`, totalX, y);
                    
                    y += 20;
                });
                
                // Total
                doc.font('Helvetica-Bold')
                    .fontSize(12)
                    .text(`Total Amount: $${service.total_cost.toFixed(2)}`, totalX - 50, y + 10);
            }
            
            doc.moveDown();
            
            // Notes
            if (service.notes) {
                doc.fontSize(12).text('Notes:', { underline: true });
                doc.fontSize(10).text(service.notes);
            }
            
            // Footer
            doc.fontSize(8)
                .text('Thank you for your business!', 50, doc.page.height - 100, { align: 'center' });
            
            doc.end();
            
            stream.on('finish', () => resolve(filename));
            stream.on('error', reject);
        });
    }

    generateMonthlyReport(reportData) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const filename = `monthly-report-${Date.now()}.pdf`;
            const filepath = path.join(__dirname, '../uploads/reports', filename);
            
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);
            
            // Generate report similar to above but with monthly data
            
            doc.end();
            stream.on('finish', () => resolve(filename));
            stream.on('error', reject);
        });
    }
}

module.exports = new PDFGenerator();