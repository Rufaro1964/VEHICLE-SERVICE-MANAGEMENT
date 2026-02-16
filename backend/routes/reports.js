// routes/reports.js - CORRECTED
const express = require('express');
const router = express.Router();

// Import middleware - NO destructuring
const auth = require('../middleware/auth');

// Import controller
const reportController = require('../controllers/reportController');

// Apply auth middleware to all routes
router.use(auth);

// Debug: Check what functions are available
console.log('=== DEBUG: reports.js ===');
console.log('reportController type:', typeof reportController);
if (reportController) {
    const functions = Object.keys(reportController).filter(k => typeof reportController[k] === 'function');
    console.log('Available functions:', functions);
}

// Routes - make sure these functions exist in reportController
router.get('/', reportController.getAllReports || fallback);
router.get('/vehicles', reportController.getVehicleReports || fallback);
router.get('/services', reportController.getServiceReports || fallback);
router.get('/financial', reportController.getFinancialReports || fallback);
router.get('/export/excel', reportController.exportReportsToExcel || fallback);

// Check if maintenance report exists before adding route
if (reportController.getMaintenanceReport) {
    router.get('/maintenance', reportController.getMaintenanceReport);
}

// Test route
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Reports route working',
        controllerAvailable: !!reportController,
        functions: reportController ? Object.keys(reportController).filter(k => typeof reportController[k] === 'function') : []
    });
});

// Fallback function for missing controller methods
function fallback(req, res) {
    res.status(501).json({
        success: false,
        message: 'Controller function not implemented'
    });
}

module.exports = router;