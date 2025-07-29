const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
require('dotenv').config();

const prisma = new PrismaClient();

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

// API info endpoint
app.get('/api', (req, res) => {
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

// Test login endpoint
app.get('/api/test-auth', async (req, res) => {
  try {
    console.log('Test auth request received');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: { email: true, role: true, isActive: true }
    });
    
    res.json({ 
      message: 'Test auth endpoint working',
      userCount: userCount,
      users: users,
      hasDatabase: !!process.env.DATABASE_URL,
      hasJWT: !!process.env.JWT_SECRET
    });
  } catch (error) {
    console.error('Test auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple test login
app.post('/api/simple-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Simple login attempt:', email);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    res.json({
      success: isValid,
      user: isValid ? { email: user.email, role: user.role } : null
    });
  } catch (error) {
    console.error('Simple login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug middleware
app.use('/api', (req, res, next) => {
  console.log(`API Request: ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);

// Serve static files from React build AFTER API routes
app.use(express.static(path.join(__dirname, '../frontend/build')));

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

// Database initialization function
async function initializeDatabase() {
  try {
    console.log('Checking database connection...');
    await prisma.$connect();
    
    // Check if users table has any data
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('Database appears empty, running initial setup...');
      
      // Run database push and seed
      exec('npx prisma db push && npm run db:seed', (error, stdout, stderr) => {
        if (error) {
          console.error('Database setup error:', error);
        } else {
          console.log('Database setup completed successfully');
          console.log(stdout);
        }
      });
    } else {
      console.log(`Database already initialized with ${userCount} users`);
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  
  // Initialize database on startup
  await initializeDatabase();
});