const express = require('express');
const cors = require('cors');
require('dotenv').config();

// ADD THIS: Import Prisma
const prisma = require('./lib/prisma');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require("./routes/auth");
const vehicleRoutes = require("./routes/vehicles");
const serviceRoutes = require("./routes/services");
const notificationRoutes = require("./routes/notifications");
const reportRoutes = require("./routes/reports");

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);

// Routes
app.get('/', (req, res) => {
  res.json({
    message: '🚗 Vehicle Service Management API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

app.get('/health', (req, res) => {
  // ADD THIS: Check database connection
  prisma.$queryRaw`SELECT 1`
    .then(() => {
      res.json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    })
    .catch(err => {
      res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        error: err.message,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'API is ready',
    available: true
  });
});

// Error handling
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ADD THIS: Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log('\n🔄 Starting graceful shutdown...');
  
  try {
    await prisma.$disconnect();
    console.log('✅ Prisma disconnected from database');
    
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('❌ Could not close connections in time, forcing shutdown');
      process.exit(1);
    }, 10000);
    
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, async () => {
  try {
    // ADD THIS: Test database connection on startup
    await prisma.$connect();
    console.log('✅ Prisma connected to database');
    
    console.log('='.repeat(50));
    console.log('🚀 VEHICLE SERVICE MANAGEMENT SYSTEM');
    console.log('='.repeat(50));
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Local:    http://localhost:${PORT}`);
    console.log(`🔧 Health:   http://localhost:${PORT}/health`);
    console.log(`📊 API Docs: http://localhost:${PORT}/`);
    console.log(`💾 Database: Connected via Prisma`);
    console.log('='.repeat(50));
    console.log('Press CTRL+C to stop the server');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    console.log('Shutting down server...');
    process.exit(1);
  }
});

// ADD THESE: Listen for shutdown signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// ADD THIS: Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});