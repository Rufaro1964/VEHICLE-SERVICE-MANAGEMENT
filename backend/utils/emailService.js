// backend/utils/emailService.js
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendServiceReminder(vehicle, serviceType, user) {
        const template = fs.readFileSync(
            path.join(__dirname, '../templates/emails/service-reminder.ejs'),
            'utf-8'
        );
        
        const html = ejs.render(template, {
            user: user.username,
            vehicle: vehicle.plate_number,
            serviceType: serviceType.name,
            dueDate: vehicle.next_service_date,
            currentMileage: vehicle.current_mileage,
            dueMileage: vehicle.next_service_due
        });

        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: user.email,
            subject: `Service Reminder: ${vehicle.plate_number} - ${serviceType.name}`,
            html: html,
            attachments: [{
                filename: 'qr-code.png',
                path: vehicle.qr_code_path,
                cid: 'qrcode'
            }]
        };

        return await this.transporter.sendMail(mailOptions);
    }

    async sendMonthlyReport(user, reportData) {
        const template = fs.readFileSync(
            path.join(__dirname, '../templates/emails/monthly-report.ejs'),
            'utf-8'
        );
        
        const html = ejs.render(template, {
            user: user.username,
            month: reportData.month,
            totalServices: reportData.summary.total_services,
            totalCost: reportData.summary.total_cost,
            services: reportData.services
        });

        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: user.email,
            subject: `Monthly Service Report - ${reportData.month}`,
            html: html
        };

        return await this.transporter.sendMail(mailOptions);
    }

    async sendSMSReminder(phone, message) {
        // Integrate with Twilio or other SMS service
        const accountSid = process.env.TWILIO_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = require('twilio')(accountSid, authToken);

        return await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
        });
    }
}

module.exports = new EmailService();