// Add this to serviceController.js
// @desc    Debug endpoint to see all service types
// @route   GET /api/services/debug/types
exports.debugServiceTypes = async (req, res) => {
  try {
    const serviceTypes = await prisma.service_types.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log('Service Types in database:', serviceTypes);
    
    res.json({
      success: true,
      count: serviceTypes.length,
      data: serviceTypes
    });
  } catch (err) {
    console.error('Error in debugServiceTypes:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};