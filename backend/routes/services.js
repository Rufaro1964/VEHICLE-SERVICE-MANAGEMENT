const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const auth = require('../middleware/auth');

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