// utils/prismaHelpers.js - OPTIONAL BUT HELPFUL
const prisma = require('../lib/prisma')

module.exports = {
  // Safe find with error handling
  safeFind: async (model, where, include = null) => {
    try {
      const data = await prisma[model].findUnique({
        where,
        include
      })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
  
  // Transaction wrapper
  transaction: async (operations) => {
    return await prisma.$transaction(operations)
  },
  
  // Pagination helper
  paginate: async (model, page = 1, limit = 10, where = {}) => {
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      prisma[model].findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' }
      }),
      prisma[model].count({ where })
    ])
    
    return {
      data,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }
}