const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const sellerRoutes = require('./routes/sellers');
const productRoutes = require('./routes/products');
const analyticsRoutes = require('./routes/analytics');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('/', (req, res) => {
  res.json({ 
    message: 'Sellers Backend API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      sellers: '/api/sellers',
      products: '/api/products',
      analytics: '/api/analytics',
      upload: '/api/upload'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  // Don't serve React for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});