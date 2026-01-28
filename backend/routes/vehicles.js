// routes/vehicles.js - FINAL CORRECTED VERSION
const express = require('express');
const router = express.Router();

// Import middleware - NO DESTRUCTURING since auth.js exports directly
const auth = require('../middleware/auth');

// Import controller
const vehicleController = require('../controllers/vehicleController');

// Apply auth middleware to all routes
router.use(auth);

// Routes
router.get('/', vehicleController.getAllVehicles);
router.get('/:id', vehicleController.getVehicle);
router.post('/', vehicleController.createVehicle);
router.put('/:id', vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);
router.get('/due/service', vehicleController.getDueForService);
router.get('/:id/qr', vehicleController.getVehicleQR);

module.exports = router;