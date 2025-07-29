const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ 
    message: 'Sellers Backend API is running!',
    version: '1.0.0',
    status: 'Active',
    endpoints: {
      auth: '/api/auth',
      sellers: '/api/sellers',
      products: '/api/products',
      analytics: '/api/analytics',
      upload: '/api/upload'
    },
    documentation: 'See README.md for full API documentation'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API endpoints are working!',
    features: [
      'Seller Management',
      'Product Catalog',
      'CSV Upload Processing',
      'Sales Analytics',
      'Commission Tracking',
      'Role-based Authentication'
    ]
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `The endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: {
      main: '/',
      health: '/health',
      test: '/api/test'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Sellers Backend Server is running!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
  console.log('\n📖 Available endpoints:');
  console.log(`   GET  /              - API information`);
  console.log(`   GET  /health        - Health check`);
  console.log(`   GET  /api/test      - Test endpoint`);
  console.log('\n🎯 Next: Set up PostgreSQL and run full version with npm run dev\n');
});