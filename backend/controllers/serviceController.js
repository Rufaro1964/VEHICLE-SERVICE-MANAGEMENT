// controllers/serviceController.js
const prisma = require('../lib/prisma');

// @desc    Get all services
// @desc    Get all services
// @route   GET /api/services
exports.getAllServices = async (req, res) => {
  try {
    console.log('✅ getAllServices called');
    
    const services = await prisma.services.findMany({
      take: 50,
      include: {
        vehicles: {
          select: {
            plate_number: true,
            make: true,
            model: true
          }
        },
        service_types: {
          select: {
            name: true
          }
        },
        users: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        service_date: 'desc'
      }
    });
    
    console.log(`✅ Found ${services.length} services`);
    
    // Map database enum values to frontend-friendly values
    const statusMap = {
      'scheduled': 'pending',     // Map 'scheduled' to 'pending' for frontend
      'in_progress': 'in_progress',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'delayed': 'pending'        // Map 'delayed' to 'pending' for frontend
    };
    
    // Format the response for easier frontend use
    const formattedServices = services.map(service => ({
      id: service.id,
      vehicle_id: service.vehicle_id,
      service_type_id: service.service_type_id,
      technician_id: service.technician_id,
      invoice_number: service.invoice_number,
      service_date: service.service_date,
      mileage_at_service: service.mileage_at_service,
      total_cost: service.total_cost,
      status: statusMap[service.service_status] || service.service_status || 'pending',
      notes: service.internal_notes || service.customer_notes || '',
      created_at: service.created_at,
      updated_at: service.updated_at,
      // Include related data
      plate_number: service.vehicles?.plate_number,
      make: service.vehicles?.make,
      model: service.vehicles?.model,
      service_type_name: service.service_types?.name,
      technician_name: service.users?.username
    }));
    
    res.json({
      success: true,
      count: services.length,
      data: formattedServices
    });
  } catch (err) {
    console.error('❌ Error in getAllServices:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};
// @route   GET /api/services
// @desc    Create new service (UPDATED with correct enum values)
// @route   POST /api/services
exports.createService = async (req, res) => {
  try {
    console.log('=== CREATE SERVICE REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      vehicle_id,
      service_type_id,
      technician_id,
      service_date,
      mileage_at_service,
      total_cost,
      notes,
      status
    } = req.body;
    
    // Validate required fields
    if (!vehicle_id || !service_date || !mileage_at_service || !total_cost) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Parse values
    const parsedVehicleId = parseInt(vehicle_id);
    const parsedTotalCost = parseFloat(total_cost);
    
    // Handle mileage_at_service carefully
    let parsedMileage;
    if (typeof mileage_at_service === 'string' || typeof mileage_at_service === 'number') {
      parsedMileage = parseInt(mileage_at_service);
      if (isNaN(parsedMileage)) {
        parsedMileage = parseFloat(mileage_at_service);
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid mileage value'
      });
    }
    
    if (isNaN(parsedVehicleId) || isNaN(parsedMileage) || isNaN(parsedTotalCost)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid numeric values'
      });
    }
    
    // Check if mileage is within reasonable range
    if (parsedMileage > 2147483647) {
      return res.status(400).json({
        success: false,
        message: 'Mileage value too large'
      });
    }
    
    if (parsedMileage < 0) {
      return res.status(400).json({
        success: false,
        message: 'Mileage cannot be negative'
      });
    }
    
    // Parse date
    const parsedDate = new Date(service_date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    // Handle service_type_id carefully
    let parsedServiceTypeId = null;
    if (service_type_id && service_type_id !== '' && service_type_id !== 'null') {
      parsedServiceTypeId = parseInt(service_type_id);
      if (isNaN(parsedServiceTypeId)) {
        parsedServiceTypeId = null;
      } else {
        // Check if service type exists
        const serviceTypeExists = await prisma.service_types.findUnique({
          where: { id: parsedServiceTypeId }
        });
        if (!serviceTypeExists) {
          console.log(`Service type ID ${parsedServiceTypeId} not found, setting to null`);
          parsedServiceTypeId = null;
        }
      }
    }
    
    // Parse technician_id
    const parsedTechnicianId = technician_id ? parseInt(technician_id) : null;
    
    // Generate invoice number
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const startOfMonth = new Date(year, today.getMonth(), 1);
    const endOfMonth = new Date(year, today.getMonth() + 1, 0);
    
    const serviceCount = await prisma.services.count({
      where: {
        service_date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });
    
    const invoiceNumber = `INV-${year}${month}-${String(serviceCount + 1).padStart(4, '0')}`;
    console.log('Generated invoice number:', invoiceNumber);
    
    // Map frontend status values to database enum values
    // Based on your schema: scheduled, in_progress, completed, cancelled, delayed
    let serviceStatusEnum = 'scheduled'; // Default value from schema
    
    if (status) {
      const statusMap = {
        'pending': 'scheduled',
        'scheduled': 'scheduled',
        'in_progress': 'in_progress',
        'in-progress': 'in_progress',
        'completed': 'completed',
        'cancelled': 'cancelled',
        'canceled': 'cancelled',
        'delayed': 'delayed'
      };
      
      const normalizedStatus = status.toLowerCase().trim();
      serviceStatusEnum = statusMap[normalizedStatus] || 'scheduled';
    }
    
    console.log('Mapping status:', status, '->', serviceStatusEnum);
    
    // Create service data
    const serviceData = {
      vehicle_id: parsedVehicleId,
      service_date: parsedDate,
      mileage_at_service: parsedMileage,
      total_cost: parsedTotalCost,
      invoice_number: invoiceNumber,
      service_status: serviceStatusEnum, // Use the correct enum value
      // Optional fields
      ...(parsedServiceTypeId !== null && { service_type_id: parsedServiceTypeId }),
      ...(parsedTechnicianId !== null && { technician_id: parsedTechnicianId }),
      ...(notes && { internal_notes: notes }),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    console.log('Creating service with data:', serviceData);
    
    const service = await prisma.services.create({
      data: serviceData
    });
    
    console.log('✅ Service created successfully. ID:', service.id);
    
    res.status(201).json({
      success: true,
      data: service
    });
    
  } catch (err) {
    console.error('❌ Error in createService:', err.message);
    console.error('Full error:', err);
    
    if (err.code === 'P2020') {
      return res.status(400).json({
        success: false,
        message: 'Value out of range for database column',
        error: err.meta?.details || 'The value is too large for the database column',
        column: 'mileage_at_service',
        solution: 'Please enter a smaller mileage value or contact admin to update database schema'
      });
    }
    
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Foreign key constraint failed',
        error: `The service_type_id (${req.body.service_type_id}) does not exist in service_types table`,
        hint: 'Use /api/services/debug/types to see available service types',
        solution: 'Use /api/services/seed-types to create default service types'
      });
    }
    
    // Handle enum validation errors
    if (err.message.includes('Expected services_service_status')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service status value',
        error: 'The service_status field requires specific enum values',
        allowed_values: ['scheduled', 'in_progress', 'completed', 'cancelled', 'delayed'],
        received_status: req.body.status,
        mapped_status: serviceStatusEnum
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
exports.getService = async (req, res) => {
  try {
    const service = await prisma.services.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        vehicles: true,
        service_types: true,
        users: true,
        spare_parts: true
      }
    });
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      data: service
    });
  } catch (err) {
    console.error('Error in getService:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new service (FIXED VERSION)
// @route   POST /api/services
exports.createService = async (req, res) => {
  try {
    console.log('=== CREATE SERVICE REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      vehicle_id,
      service_type_id,
      technician_id,
      service_date,
      mileage_at_service,
      total_cost,
      notes,
      status
    } = req.body;
    
    // Validate required fields
    if (!vehicle_id || !service_date || !mileage_at_service || !total_cost) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Parse values
    const parsedVehicleId = parseInt(vehicle_id);
    const parsedMileage = parseInt(mileage_at_service);
    const parsedTotalCost = parseFloat(total_cost);
    
    if (isNaN(parsedVehicleId) || isNaN(parsedMileage) || isNaN(parsedTotalCost)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid numeric values'
      });
    }
    
    // Parse date
    const parsedDate = new Date(service_date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    // Handle service_type_id carefully
    let parsedServiceTypeId = null;
    if (service_type_id && service_type_id !== '' && service_type_id !== 'null') {
      parsedServiceTypeId = parseInt(service_type_id);
      if (isNaN(parsedServiceTypeId)) {
        parsedServiceTypeId = null;
      } else {
        // Check if service type exists
        const serviceTypeExists = await prisma.service_types.findUnique({
          where: { id: parsedServiceTypeId }
        });
        if (!serviceTypeExists) {
          console.log(`Service type ID ${parsedServiceTypeId} not found, setting to null`);
          parsedServiceTypeId = null;
        }
      }
    }
    
    // Parse technician_id
    const parsedTechnicianId = technician_id ? parseInt(technician_id) : null;
    
    // Generate invoice number
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const startOfMonth = new Date(year, today.getMonth(), 1);
    const endOfMonth = new Date(year, today.getMonth() + 1, 0);
    
    const serviceCount = await prisma.services.count({
      where: {
        service_date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });
    
    const invoiceNumber = `INV-${year}${month}-${String(serviceCount + 1).padStart(4, '0')}`;
    console.log('Generated invoice number:', invoiceNumber);
    
    // Create service with minimal required fields
    const serviceData = {
      vehicle_id: parsedVehicleId,
      service_date: parsedDate,
      mileage_at_service: parsedMileage,
      total_cost: parsedTotalCost,
      invoice_number: invoiceNumber,
      // Optional fields - only include if they exist in your schema
      ...(parsedServiceTypeId !== null && { service_type_id: parsedServiceTypeId }),
      ...(parsedTechnicianId !== null && { technician_id: parsedTechnicianId }),
      // Use internal_notes if notes field doesn't exist
      ...(notes && { internal_notes: notes }),
      // Use service_status if status field doesn't exist
      ...(status && { service_status: status }),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    console.log('Creating service with data:', serviceData);
    
    const service = await prisma.services.create({
      data: serviceData
    });
    
    console.log('✅ Service created successfully. ID:', service.id);
    
    res.status(201).json({
      success: true,
      data: service
    });
    
  } catch (err) {
    console.error('❌ Error in createService:', err.message);
    console.error('Full error:', err);
    
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Foreign key constraint failed',
        error: `The service_type_id (${req.body.service_type_id}) does not exist in service_types table`,
        hint: 'Use /api/services/debug/types to see available service types',
        solution: 'Use /api/services/seed-types to create default service types'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
exports.updateService = async (req, res) => {
  try {
    const service = await prisma.services.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    
    res.json({
      success: true,
      data: service
    });
  } catch (err) {
    console.error('Error in updateService:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
exports.deleteService = async (req, res) => {
  try {
    await prisma.services.delete({
      where: { id: parseInt(req.params.id) }
    });
    
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (err) {
    console.error('Error in deleteService:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get service types
// @route   GET /api/services/types
exports.getServiceTypes = async (req, res) => {
  try {
    const serviceTypes = await prisma.service_types.findMany();
    
    res.json({
      success: true,
      data: serviceTypes
    });
  } catch (err) {
    console.error('Error in getServiceTypes:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get monthly report
// @route   GET /api/services/report/monthly
exports.getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const startDate = new Date(year || new Date().getFullYear(), month ? month - 1 : new Date().getMonth(), 1);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    
    const services = await prisma.services.findMany({
      where: {
        service_date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        vehicles: true,
        service_types: true
      },
      orderBy: {
        service_date: 'desc'
      }
    });
    
    const totalRevenue = services.reduce((sum, service) => sum + (service.total_cost || 0), 0);
    
    res.json({
      success: true,
      data: {
        services,
        summary: {
          totalServices: services.length,
          totalRevenue,
          averageRevenue: services.length > 0 ? totalRevenue / services.length : 0
        }
      }
    });
  } catch (err) {
    console.error('Error in getMonthlyReport:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Export services to Excel
// @route   GET /api/services/export/excel
exports.exportToExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let where = {};
    
    if (startDate || endDate) {
      where.service_date = {};
      if (startDate) where.service_date.gte = new Date(startDate);
      if (endDate) where.service_date.lte = new Date(endDate);
    }
    
    const services = await prisma.services.findMany({
      where,
      include: {
        vehicles: true,
        service_types: true,
        users: true
      },
      orderBy: {
        service_date: 'desc'
      }
    });
    
    res.json({
      success: true,
      data: services,
      message: 'Export functionality ready.'
    });
  } catch (err) {
    console.error('Error in exportToExcel:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Test endpoint to debug date issues
exports.testCreate = async (req, res) => {
  console.log('=== TEST CREATE SERVICE REQUEST ===');
  console.log('Headers:', req.headers['content-type']);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Body keys:', Object.keys(req.body));
  console.log('=== END TEST ===');
  
  res.json({
    success: true,
    received: req.body,
    parsed_date: req.body.service_date ? new Date(req.body.service_date) : 'No date'
  });
};

// @desc    Debug endpoint to see all service types
// @route   GET /api/services/debug/types
exports.debugServiceTypes = async (req, res) => {
  try {
    console.log('=== DEBUG SERVICE TYPES ENDPOINT CALLED ===');
    
    const serviceTypes = await prisma.service_types.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log(`Found ${serviceTypes.length} service types in database:`);
    
    if (serviceTypes.length === 0) {
      console.log('⚠️ WARNING: No service types found in database!');
      console.log('This is why you get foreign key errors when creating services.');
    } else {
      serviceTypes.forEach(type => {
        console.log(`  ID: ${type.id}, Name: "${type.name}"`);
      });
    }
    
    // Also show what service types are currently being used
    const servicesWithTypes = await prisma.services.findMany({
      where: {
        service_type_id: {
          not: null
        }
      },
      select: {
        id: true,
        invoice_number: true,
        service_type_id: true,
        service_types: {
          select: {
            name: true
          }
        }
      },
      orderBy: { id: 'desc' },
      take: 5
    });
    
    console.log(`Recent services with service types (${servicesWithTypes.length}):`);
    servicesWithTypes.forEach(service => {
      console.log(`  Service ID: ${service.id}, Invoice: ${service.invoice_number || 'N/A'}, Type ID: ${service.service_type_id}, Type Name: ${service.service_types?.name || 'Unknown'}`);
    });
    
    // Check the structure of the services table
    const sampleService = await prisma.services.findFirst({
      select: {
        id: true,
        vehicle_id: true,
        service_type_id: true,
        invoice_number: true,
        service_date: true
      }
    });
    
    console.log('Sample service structure:', sampleService);
    
    res.json({
      success: true,
      count: serviceTypes.length,
      data: serviceTypes,
      recent_services: servicesWithTypes,
      sample_service: sampleService,
      message: serviceTypes.length === 0 
        ? '⚠️ No service types found! You need to seed the database.' 
        : 'Service types retrieved successfully'
    });
  } catch (err) {
    console.error('❌ Error in debugServiceTypes:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Seed default service types
// @route   POST /api/services/seed-types
exports.seedServiceTypes = async (req, res) => {
  try {
    console.log('=== SEEDING SERVICE TYPES ===');
    
    const defaultServiceTypes = [
      { name: 'Oil Change', description: 'Engine oil and filter change', estimated_duration: 60, base_labor_cost: 50.00, category: 'routine' },
      { name: 'Brake Service', description: 'Brake pads and rotors replacement', estimated_duration: 120, base_labor_cost: 150.00, category: 'repair' },
      { name: 'Tire Rotation', description: 'Rotate tires for even wear', estimated_duration: 45, base_labor_cost: 30.00, category: 'routine' },
      { name: 'Engine Tune-up', description: 'Spark plugs, filters, and system check', estimated_duration: 180, base_labor_cost: 200.00, category: 'maintenance' },
      { name: 'Transmission Service', description: 'Transmission fluid change', estimated_duration: 90, base_labor_cost: 120.00, category: 'maintenance' },
      { name: 'Battery Replacement', description: 'Car battery replacement', estimated_duration: 30, base_labor_cost: 40.00, category: 'repair' },
      { name: 'AC Service', description: 'Air conditioning system service', estimated_duration: 120, base_labor_cost: 150.00, category: 'repair' },
      { name: 'General Maintenance', description: 'General vehicle maintenance', estimated_duration: 60, base_labor_cost: 75.00, category: 'routine' },
      { name: 'Suspension Service', description: 'Suspension system repair', estimated_duration: 180, base_labor_cost: 250.00, category: 'repair' },
      { name: 'Exhaust Repair', description: 'Exhaust system repair', estimated_duration: 120, base_labor_cost: 180.00, category: 'repair' },
    ];
    
    const createdTypes = [];
    const skippedTypes = [];
    
    for (const type of defaultServiceTypes) {
      try {
        // Check if already exists
        const existing = await prisma.service_types.findFirst({
          where: { 
            name: {
              equals: type.name,
              mode: 'insensitive'
            }
          }
        });
        
        if (!existing) {
          const created = await prisma.service_types.create({
            data: type
          });
          createdTypes.push(created);
          console.log(`✅ Created service type: ${type.name} (ID: ${created.id})`);
        } else {
          skippedTypes.push(existing);
          console.log(`⚠️ Service type already exists: ${type.name} (ID: ${existing.id})`);
        }
      } catch (typeError) {
        console.error(`Error processing service type "${type.name}":`, typeError.message);
      }
    }
    
    console.log(`=== SEEDING COMPLETE ===`);
    console.log(`Created: ${createdTypes.length}, Skipped: ${skippedTypes.length}`);
    
    res.json({
      success: true,
      message: `Seeded ${createdTypes.length} new service types, ${skippedTypes.length} already existed`,
      created: createdTypes,
      skipped: skippedTypes,
      total: createdTypes.length + skippedTypes.length
    });
    
  } catch (err) {
    console.error('Error in seedServiceTypes:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Debug database schema for services table
// @route   GET /api/services/debug/schema
exports.debugSchema = async (req, res) => {
  try {
    console.log('=== DEBUG SERVICES SCHEMA ===');
    
    // Get a sample service to see structure
    const sampleService = await prisma.services.findFirst();
    
    // Get all services count
    const totalServices = await prisma.services.count();
    
    // Get services with null service_type_id
    const servicesWithNullType = await prisma.services.findMany({
      where: { service_type_id: null },
      select: { id: true, invoice_number: true, vehicle_id: true }
    });
    
    // Get all field names from a sample
    let fieldNames = [];
    if (sampleService) {
      fieldNames = Object.keys(sampleService);
    }
    
    console.log('Total services in database:', totalServices);
    console.log('Services with null service_type_id:', servicesWithNullType.length);
    console.log('Sample service fields:', fieldNames);
    console.log('Sample service:', sampleService);
    
    res.json({
      success: true,
      schema_info: {
        total_services: totalServices,
        services_with_null_type: servicesWithNullType.length,
        sample_fields: fieldNames,
        sample_service: sampleService,
        null_type_services: servicesWithNullType
      }
    });
  } catch (err) {
    console.error('Error in debugSchema:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

console.log('✅ serviceController loaded with debug functions');