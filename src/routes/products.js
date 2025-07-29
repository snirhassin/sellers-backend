const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, operatorMiddleware, sellerMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/seller/:sellerId', authMiddleware, sellerMiddleware, async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      search, 
      market, 
      status, 
      commissionMin, 
      commissionMax,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { sellerId };
    
    if (search) {
      where.OR = [
        { asin: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (market) where.market = market;
    if (status) where.status = status;
    
    if (commissionMin || commissionMax) {
      where.commissionRate = {};
      if (commissionMin) where.commissionRate.gte = parseFloat(commissionMin);
      if (commissionMax) where.commissionRate.lte = parseFloat(commissionMax);
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          seller: {
            select: {
              companyName: true
            }
          },
          uploadBatch: {
            select: {
              filename: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              salesData: true
            }
          }
        },
        orderBy
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: true,
        uploadBatch: true,
        salesData: {
          orderBy: { saleDate: 'desc' },
          take: 10
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (req.user.role === 'seller' && req.user.sellerId !== product.sellerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', authMiddleware, operatorMiddleware, async (req, res) => {
  try {
    const {
      sellerId,
      asin,
      market,
      productName,
      description,
      price,
      currency,
      commissionRate
    } = req.body;

    if (!sellerId || !asin || !market || !productName || !commissionRate) {
      return res.status(400).json({ 
        error: 'Seller ID, ASIN, market, product name, and commission rate are required' 
      });
    }

    const seller = await prisma.seller.findUnique({
      where: { id: sellerId }
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        sellerId_asin_market: {
          sellerId,
          asin,
          market
        }
      }
    });

    if (existingProduct) {
      return res.status(400).json({ 
        error: 'Product with this ASIN and market already exists for this seller' 
      });
    }

    const product = await prisma.product.create({
      data: {
        sellerId,
        asin,
        market: market.toUpperCase(),
        productName,
        description,
        price: price ? parseFloat(price) : null,
        currency: currency || 'USD',
        commissionRate: parseFloat(commissionRate),
        status: 'active'
      },
      include: {
        seller: {
          select: {
            companyName: true
          }
        }
      }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', authMiddleware, operatorMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productName,
      description,
      price,
      currency,
      commissionRate,
      status
    } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updateData = {};
    if (productName) updateData.productName = productName;
    if (description !== undefined) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (currency) updateData.currency = currency;
    if (commissionRate) updateData.commissionRate = parseFloat(commissionRate);
    if (status) updateData.status = status;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        seller: {
          select: {
            companyName: true
          }
        }
      }
    });

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', authMiddleware, operatorMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: { salesData: true }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product._count.salesData > 0) {
      await prisma.product.update({
        where: { id },
        data: { status: 'discontinued' }
      });
      res.json({ message: 'Product marked as discontinued (has sales data)' });
    } else {
      await prisma.product.delete({
        where: { id }
      });
      res.json({ message: 'Product deleted successfully' });
    }
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

router.post('/bulk-update', authMiddleware, operatorMiddleware, async (req, res) => {
  try {
    const { productIds, updates } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'Product IDs array is required' });
    }

    const updateData = {};
    if (updates.commissionRate) updateData.commissionRate = parseFloat(updates.commissionRate);
    if (updates.status) updateData.status = updates.status;
    if (updates.currency) updateData.currency = updates.currency;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    const result = await prisma.product.updateMany({
      where: {
        id: {
          in: productIds
        }
      },
      data: updateData
    });

    res.json({ 
      message: `Updated ${result.count} products`,
      updatedCount: result.count 
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to update products' });
  }
});

router.post('/bulk-delete', authMiddleware, operatorMiddleware, async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'Product IDs array is required' });
    }

    const productsWithSales = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      },
      include: {
        _count: {
          select: { salesData: true }
        }
      }
    });

    const toDeactivate = productsWithSales.filter(p => p._count.salesData > 0).map(p => p.id);
    const toDelete = productsWithSales.filter(p => p._count.salesData === 0).map(p => p.id);

    const results = {
      deactivated: 0,
      deleted: 0
    };

    if (toDeactivate.length > 0) {
      const deactivateResult = await prisma.product.updateMany({
        where: { id: { in: toDeactivate } },
        data: { status: 'discontinued' }
      });
      results.deactivated = deactivateResult.count;
    }

    if (toDelete.length > 0) {
      const deleteResult = await prisma.product.deleteMany({
        where: { id: { in: toDelete } }
      });
      results.deleted = deleteResult.count;
    }

    res.json({
      message: `Processed ${productIds.length} products`,
      results
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to delete products' });
  }
});

module.exports = router;