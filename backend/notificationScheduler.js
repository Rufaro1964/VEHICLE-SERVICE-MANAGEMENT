// backend/utils/notificationScheduler.js
const cron = require('node-cron');
const db = require('../config/db');
const emailService = require('./emailService');
const { io } = require('../server');

class NotificationScheduler {
    constructor() {
        this.initSchedulers();
    }

    initSchedulers() {
        // Check for due services every day at 9 AM
        cron.schedule('0 9 * * *', () => {
            this.checkDueServices();
        });

        // Send weekly reports every Monday at 8 AM
        cron.schedule('0 8 * * 1', () => {
            this.sendWeeklyReports();
        });

        // Check for upcoming services (7 days before)
        cron.schedule('0 10 * * *', () => {
            this.checkUpcomingServices();
        });
    }

    async checkDueServices() {
        try {
            const [vehicles] = await db.query(`
                SELECT v.*, u.email, u.username, u.phone, u.notification_preferences
                FROM vehicles v
                JOIN users u ON v.user_id = u.id
                WHERE v.next_service_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
                OR v.current_mileage >= v.next_service_due * 0.9
            `);

            for (const vehicle of vehicles) {
                // Check notification preferences
                const prefs = vehicle.notification_preferences || {};
                
                if (prefs.email !== false) {
                    await this.sendEmailNotification(vehicle);
                }
                
                if (prefs.sms === true && vehicle.phone) {
                    await this.sendSMSNotification(vehicle);
                }
                
                if (prefs.inApp !== false) {
                    await this.createInAppNotification(vehicle);
                }
            }
        } catch (error) {
            console.error('Error checking due services:', error);
        }
    }

    async sendEmailNotification(vehicle) {
        const serviceType = await this.getServiceType(vehicle);
        await emailService.sendServiceReminder(vehicle, serviceType, {
            email: vehicle.email,
            username: vehicle.username
        });
    }

    async sendSMSNotification(vehicle) {
        const message = `Service Reminder: Vehicle ${vehicle.plate_number} is due for service. Current mileage: ${vehicle.current_mileage}`;
        await emailService.sendSMSReminder(vehicle.phone, message);
    }

    async createInAppNotification(vehicle) {
        const [result] = await db.query(`
            INSERT INTO notifications (user_id, vehicle_id, type, title, message, sent_via)
            VALUES (?, ?, 'service_due', 'Service Due', ?, 'in_app')
        `, [
            vehicle.user_id,
            vehicle.id,
            `Vehicle ${vehicle.plate_number} is due for service. Please schedule a service appointment.`
        ]);

        // Send real-time notification via Socket.IO
        const io = require('../server').io;
        io.to(`user_${vehicle.user_id}`).emit('new-notification', {
            id: result.insertId,
            title: 'Service Due',
            message: `Vehicle ${vehicle.plate_number} is due for service`,
            type: 'service_due'
        });
    }

    async getServiceType(vehicle) {
        const [rows] = await db.query(
            'SELECT * FROM service_types ORDER BY mileage_interval DESC LIMIT 1'
        );
        return rows[0] || { name: 'Regular Service' };
    }

    async sendWeeklyReports() {
        const [users] = await db.query(`
            SELECT u.* FROM users u
            WHERE u.role IN ('admin', 'user')
            AND u.email IS NOT NULL
        `);

        for (const user of users) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            
            const [services] = await db.query(`
                SELECT COUNT(*) as count, SUM(total_cost) as total
                FROM services s
                JOIN vehicles v ON s.vehicle_id = v.id
                WHERE v.user_id = ?
                AND s.service_date >= ?
            `, [user.id, startDate]);

            if (services[0].count > 0) {
                await emailService.sendWeeklyReport(user, services[0]);
            }
        }
    }

    async checkUpcomingServices() {
        const [vehicles] = await db.query(`
            SELECT v.*, u.email, u.username
            FROM vehicles v
            JOIN users u ON v.user_id = u.id
            WHERE v.next_service_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        `);

        for (const vehicle of vehicles) {
            await emailService.sendUpcomingServiceReminder(vehicle);
        }
    }
}

module.exports = new NotificationScheduler();