const express = require('express');
const router = express.Router();

// FIX 1: Correct the typo
const vehicleController = require('../controllers/vehicleController');

// FIX 2: Destructure to get just the auth function
const { auth } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Routes
router.get('/', vehicleController.getAllVehicles);
router.get('/due/service', vehicleController.getDueForService);
router.get('/:id', vehicleController.getVehicle);
router.get('/:id/qr', vehicleController.getVehicleQR);
router.post('/', vehicleController.createVehicle);
router.put('/:id', vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;