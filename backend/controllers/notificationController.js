// controllers/notificationController.js - UPDATED VERSION
const prisma = require('../lib/prisma');  // CHANGED FROM: const db = require('../config/db')

// @desc    Get all notifications
// @route   GET /api/notifications
exports.getAllNotifications = async (req, res) => {
    try {
        // CHANGED: Get notifications with Prisma
        const notifications = await prisma.notifications.findMany({
            where: { user_id: req.user.id },  // Note: might be userId or user_id
            orderBy: { created_at: 'desc' }  // Note: might be createdAt or created_at
        });
        
        res.json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get unread notifications
// @route   GET /api/notifications/unread
exports.getUnreadNotifications = async (req, res) => {
    try {
        // CHANGED: Get unread notifications
        const notifications = await prisma.notifications.findMany({
            where: { 
                user_id: req.user.id,
                is_read: false  // Note: might be isRead or is_read
            },
            orderBy: { created_at: 'desc' }
        });
        
        res.json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
    try {
        // CHANGED: Update notification
        await prisma.notifications.updateMany({
            where: {
                id: parseInt(req.params.id),
                user_id: req.user.id
            },
            data: {
                is_read: true
            }
        });
        
        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
    try {
        // CHANGED: Update all notifications
        await prisma.notifications.updateMany({
            where: {
                user_id: req.user.id,
                is_read: false
            },
            data: {
                is_read: true
            }
        });
        
        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
    try {
        // CHANGED: Delete notification
        await prisma.notifications.deleteMany({
            where: {
                id: parseInt(req.params.id),
                user_id: req.user.id
            }
        });
        
        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Optional: Create notification (for completeness)
exports.createNotification = async (req, res) => {
    try {
        const { vehicle_id, type, title, message } = req.body;
        
        // CHANGED: Create notification
        const notification = await prisma.notifications.create({
            data: {
                user_id: req.user.id,
                vehicle_id: vehicle_id,
                type: type,
                title: title,
                message: message
            }
        });
        
        res.status(201).json({
            success: true,
            data: notification
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};