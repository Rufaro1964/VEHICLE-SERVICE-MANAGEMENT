const express = require('express');
const router = express.Router();

// Clear all caches for fresh imports
delete require.cache[require.resolve('../controllers/authController')];
delete require.cache[require.resolve('../middleware/auth')];

// Import with debugging
console.log('\n=== LOADING ROUTES ===');
const authController = require('../controllers/authController');
console.log('authController loaded');

const authMiddleware = require('../middleware/auth');
console.log('authMiddleware loaded');

// Check what we got
console.log('authMiddleware type:', typeof authMiddleware);
console.log('authMiddleware keys:', Object.keys(authMiddleware));

// Get the auth function - adjust based on actual export
const auth = authMiddleware.auth || authMiddleware;

console.log('auth type:', typeof auth);
console.log('authController.register type:', typeof authController.register);

// Define routes
console.log('\nDefining routes...');

// Route 1 - should be line 11
router.post('/register', authController.register);

// Route 2
router.post('/login', authController.login);

// Route 3
router.get('/me', auth, authController.getMe);

// Route 4
router.post('/logout', auth, authController.logout);

console.log('All routes defined successfully!\n');

module.exports = router;