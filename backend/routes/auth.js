const express = require('express');
const router = express.Router();

console.log('\n=== DEBUG auth.js ===');

// Test imports
const authController = require('../controllers/authController');
console.log('1. authController type:', typeof authController);
console.log('2. authController.getMe type:', typeof authController.getMe);

const authModule = require('../middleware/auth');
console.log('3. authModule type:', typeof authModule);
console.log('4. authModule keys:', Object.keys(authModule));

// Try to get auth function
let auth;
if (typeof authModule === 'function') {
    auth = authModule;
    console.log('5. authModule is a function');
} else if (authModule.auth) {
    auth = authModule.auth;
    console.log('5. Using authModule.auth');
} else {
    console.error('5. ERROR: No auth function found');
    auth = (req, res, next) => next(); // fallback
}

console.log('6. auth type:', typeof auth);

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Line 11 - the problematic line
console.log('\n7. Setting up line 11...');
console.log('   auth type on line 11:', typeof auth);
console.log('   authController.getMe type on line 11:', typeof authController.getMe);
router.get('/me', auth, authController.getMe);

router.post('/logout', auth, authController.logout);

console.log('=== DEBUG END ===\n');

module.exports = router;