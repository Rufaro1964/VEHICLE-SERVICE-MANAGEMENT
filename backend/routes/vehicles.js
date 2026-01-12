const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', vehicleController.getAllVehicles);
router.get('/due/service', vehicleController.getDueForService);
router.get('/:id', vehicleController.getVehicle);
router.get('/:id/qr', vehicleController.getVehicleQR);
router.post('/', vehicleController.createVehicle);
router.put('/:id', vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;