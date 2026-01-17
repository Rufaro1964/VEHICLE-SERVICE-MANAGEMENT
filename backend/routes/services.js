const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// FIX: Use destructuring to get just the auth function
const { auth } = require('../middleware/auth');  // <-- Add curly braces!

router.use(auth);

router.get('/', serviceController.getAllServices);
router.get('/types', serviceController.getServiceTypes);
router.get('/report/:year/:month', serviceController.getMonthlyReport);
router.get('/export/excel', serviceController.exportToExcel);
router.get('/:id', serviceController.getService);
router.post('/', serviceController.createService);
router.put('/:id', serviceController.updateService);
router.delete('/:id', serviceController.deleteService);

module.exports = router;