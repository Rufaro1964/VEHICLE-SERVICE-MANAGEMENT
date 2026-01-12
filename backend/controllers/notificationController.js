const db = require('../config/db');

// @desc    Get user notifications
// @route   GET /api/notifications
exports.getNotifications = async (req, res) => {
    try {
        const { limit = 50, unread_only = false } = req.query;
        
        let query = `
            SELECT n.*, v.plate_number as vehicle_plate
            FROM notifications n
            LEFT JOIN vehicles v ON n.vehicle_id = v.id
            WHERE n.user_id = ?
        `;
        
        const params = [req.user.id];
        
        if (unread_only === 'true') {
            query += ' AND n.is_read = FALSE';
        }
        
        query += ' ORDER BY n.created_at DESC LIMIT ?';
        params.push(parseInt(limit));
        
        const [notifications] = await db.query(query, params);
        
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

// @desc    Create notification
// @route   POST /api/notifications
exports.createNotification = async (req, res) => {
    try {
        const { vehicle_id, type, title, message } = req.body;
        
        const [result] = await db.query(
            `INSERT INTO notifications (user_id, vehicle_id, type, title, message) 
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, vehicle_id, type, title, message]
        );
        
        // Send real-time notification
        const io = req.app.get('io');
        io.to(`user_${req.user.id}`).emit('new-notification', {
            id: result.insertId,
            title,
            message,
            type,
            vehicle_id,
            created_at: new Date()
        });
        
        res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                title,
                message,
                type,
                vehicle_id
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