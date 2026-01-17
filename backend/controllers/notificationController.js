// controllers/notificationController.js - Updated to match original routes
const db = require('../config/db');

// @desc    Get all notifications
// @route   GET /api/notifications
exports.getAllNotifications = async (req, res) => {
    try {
        const [notifications] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        
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
        const [notifications] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? AND is_read = FALSE ORDER BY created_at DESC',
            [req.user.id]
        );
        
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
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        
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
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
            [req.user.id]
        );
        
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
        await db.query(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        
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
        
        const [result] = await db.query(
            `INSERT INTO notifications (user_id, vehicle_id, type, title, message) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, vehicle_id, type, title, message]
        );
        
        res.status(201).json({
            success: true,
            data: { id: result.insertId }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};