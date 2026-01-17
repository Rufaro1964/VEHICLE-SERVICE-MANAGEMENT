const express = require('express');
const cors = require('cors');
require('dotenv').config();

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
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
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

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 VEHICLE SERVICE MANAGEMENT SYSTEM');
  console.log('='.repeat(50));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Local:    http://localhost:${PORT}`);
  console.log(`🔧 Health:   http://localhost:${PORT}/health`);
  console.log(`📊 API Docs: http://localhost:${PORT}/`);
  console.log('='.repeat(50));
  console.log('Press CTRL+C to stop the server');
  console.log('='.repeat(50));
});
