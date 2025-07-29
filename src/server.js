const express = require('express');
const cors = require('cors');
const path = require('path');

// Only load .env in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Create Prisma client with explicit URL
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

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
    console.log('=== DATABASE INITIALIZATION ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check if tables exist by trying to count users
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Database already initialized with ${userCount} users`);
      return true;
    } catch (error) {
      console.log('📝 Tables do not exist, initializing database...');
      
      // Run database setup
      const { execSync } = require('child_process');
      try {
        console.log('Running prisma db push...');
        execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
        
        console.log('Running database seed...');
        execSync('npm run db:seed', { stdio: 'inherit' });
        
        console.log('✅ Database setup completed successfully');
        return true;
      } catch (setupError) {
        console.error('❌ Database setup failed:', setupError.message);
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  
  // Initialize database
  const dbReady = await initializeDatabase();
  if (dbReady) {
    console.log('🎉 Application ready!');
  } else {
    console.error('❌ Database initialization failed, but server will continue');
  }
});