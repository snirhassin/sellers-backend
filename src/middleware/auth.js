const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

// Create Prisma client with explicit URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        isActive: true 
      },
      include: {
        seller: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

const operatorMiddleware = (req, res, next) => {
  if (!['admin', 'operator'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Operator role required.' });
  }
  next();
};

const sellerMiddleware = (req, res, next) => {
  if (req.user.role === 'seller' && req.user.sellerId !== req.params.sellerId) {
    return res.status(403).json({ error: 'Access denied. Can only access own data.' });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  operatorMiddleware,
  sellerMiddleware
};