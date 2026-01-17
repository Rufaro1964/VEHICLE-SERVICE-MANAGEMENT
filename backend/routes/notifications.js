// routes/notifications.js - CORRECTED VERSION
const express = require('express');
const router = express.Router();

// Import controller (create this file)
const notificationController = require('../controllers/notificationController');

// FIX: Use destructuring to get just the auth function
const { auth } = require('../middleware/auth');  // <-- Add curly braces!

// Line 6: Apply auth middleware
router.use(auth);

// Routes
router.get('/', notificationController.getAllNotifications);
router.get('/unread', notificationController.getUnreadNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;