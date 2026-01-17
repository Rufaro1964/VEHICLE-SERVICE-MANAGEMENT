// routes/reports.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// FIX: Use destructuring
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', reportController.getAllReports);
router.get('/vehicles', reportController.getVehicleReports);
router.get('/services', reportController.getServiceReports);
router.get('/financial', reportController.getFinancialReports);
router.get('/export/excel', reportController.exportReportsToExcel);

module.exports = router;