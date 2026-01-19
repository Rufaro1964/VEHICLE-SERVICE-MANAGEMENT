const prisma = require('../lib/prisma')

// Simple working version
exports.getAllServices = async (req, res) => {
  try {
    console.log('✅ getAllServices called')
    const services = await prisma.services.findMany({
      take: 10,
      include: {
        vehicles: {
          select: { plate_number: true, make: true, model: true }
        }
      }
    })
    
    res.json({
      success: true,
      count: services.length,
      data: services
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

exports.getService = async (req, res) => {
  res.json({ success: true, message: 'getService endpoint' })
}

exports.createService = async (req, res) => {
  res.json({ success: true, message: 'createService endpoint' })
}

exports.updateService = async (req, res) => {
  res.json({ success: true, message: 'updateService endpoint' })
}

exports.deleteService = async (req, res) => {
  res.json({ success: true, message: 'deleteService endpoint' })
}

exports.getMonthlyReport = async (req, res) => {
  res.json({ success: true, message: 'getMonthlyReport endpoint' })
}

exports.getServiceTypes = async (req, res) => {
  res.json({ success: true, message: 'getServiceTypes endpoint' })
}

exports.exportToExcel = async (req, res) => {
  res.json({ success: true, message: 'exportToExcel endpoint' })
}

console.log('✅ serviceController fixed and loaded')
