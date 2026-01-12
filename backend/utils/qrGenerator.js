// backend/utils/qrGenerator.js
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class QRGenerator {
    async generateVehicleQR(vehicle) {
        const qrData = {
            vehicleId: vehicle.id,
            plateNumber: vehicle.plate_number,
            chassisNumber: vehicle.chassis_number,
            serviceInfo: {
                lastService: vehicle.last_service_date,
                nextService: vehicle.next_service_due,
                currentMileage: vehicle.current_mileage
            }
        };
        
        const qrString = JSON.stringify(qrData);
        const filename = `vehicle-${vehicle.id}-${Date.now()}.png`;
        const filepath = path.join(__dirname, '../public/qrcodes', filename);
        
        // Ensure directory exists
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
        
        await QRCode.toFile(filepath, qrString, {
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 300,
            margin: 1
        });
        
        return `/qrcodes/${filename}`;
    }

    async generateServiceQR(service) {
        const qrData = {
            serviceId: service.id,
            invoiceNumber: service.invoice_number,
            vehiclePlate: service.plate_number,
            serviceDate: service.service_date,
            totalCost: service.total_cost,
            status: service.status
        };
        
        const filename = `service-${service.id}-${Date.now()}.png`;
        const filepath = path.join(__dirname, '../public/qrcodes', filename);
        
        await QRCode.toFile(filepath, JSON.stringify(qrData), {
            width: 300,
            margin: 1
        });
        
        return `/qrcodes/${filename}`;
    }
}

module.exports = new QRGenerator();