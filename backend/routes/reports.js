const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(auth);

router.get('/dashboard', reportController.getDashboardStats);
router.get('/financial', reportController.getFinancialReport);
router.get('/export/vehicles', reportController.exportVehiclesToExcel);
router.post('/import/vehicles', upload.single('file'), reportController.importVehiclesFromExcel);

module.exports = router;