const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, operatorMiddleware, sellerMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authMiddleware, operatorMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [sellers, total] = await Promise.all([
      prisma.seller.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          _count: {
            select: {
              products: true,
              uploadBatches: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.seller.count({ where })
    ]);

    res.json({
      sellers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get sellers error:', error);
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

router.get('/:id', authMiddleware, sellerMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await prisma.seller.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            uploadBatches: true
          }
        },
        products: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { salesData: true }
            }
          }
        }
      }
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    res.json(seller);
  } catch (error) {
    console.error('Get seller error:', error);
    res.status(500).json({ error: 'Failed to fetch seller' });
  }
});

router.post('/', authMiddleware, operatorMiddleware, async (req, res) => {
  try {
    const {
      companyName,
      contactEmail,
      contactPhone,
      contactPerson,
      defaultCommissionRate,
      notes
    } = req.body;

    if (!companyName || !contactEmail) {
      return res.status(400).json({ error: 'Company name and contact email are required' });
    }

    const existingSeller = await prisma.seller.findUnique({
      where: { contactEmail }
    });

    if (existingSeller) {
      return res.status(400).json({ error: 'Seller with this email already exists' });
    }

    const seller = await prisma.seller.create({
      data: {
        companyName,
        contactEmail,
        contactPhone,
        contactPerson,
        defaultCommissionRate: defaultCommissionRate || 7.5,
        notes,
        status: 'active'
      }
    });

    res.status(201).json(seller);
  } catch (error) {
    console.error('Create seller error:', error);
    res.status(500).json({ error: 'Failed to create seller' });
  }
});

router.put('/:id', authMiddleware, operatorMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      companyName,
      contactEmail,
      contactPhone,
      contactPerson,
      defaultCommissionRate,
      status,
      notes
    } = req.body;

    const existingSeller = await prisma.seller.findUnique({
      where: { id }
    });

    if (!existingSeller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    if (contactEmail && contactEmail !== existingSeller.contactEmail) {
      const emailExists = await prisma.seller.findUnique({
        where: { contactEmail }
      });
      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use by another seller' });
      }
    }

    const seller = await prisma.seller.update({
      where: { id },
      data: {
        companyName,
        contactEmail,
        contactPhone,
        contactPerson,
        defaultCommissionRate,
        status,
        notes
      }
    });

    res.json(seller);
  } catch (error) {
    console.error('Update seller error:', error);
    res.status(500).json({ error: 'Failed to update seller' });
  }
});

router.delete('/:id', authMiddleware, operatorMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await prisma.seller.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    if (seller._count.products > 0) {
      await prisma.seller.update({
        where: { id },
        data: { status: 'inactive' }
      });
      res.json({ message: 'Seller deactivated (has associated products)' });
    } else {
      await prisma.seller.delete({
        where: { id }
      });
      res.json({ message: 'Seller deleted successfully' });
    }
  } catch (error) {
    console.error('Delete seller error:', error);
    res.status(500).json({ error: 'Failed to delete seller' });
  }
});

router.get('/:id/summary', authMiddleware, sellerMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await prisma.seller.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            salesData: true
          }
        },
        uploadBatches: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    const totalProducts = seller.products.length;
    const activeProducts = seller.products.filter(p => p.status === 'active').length;
    
    const totalCommission = seller.products.reduce((sum, product) => {
      return sum + product.salesData.reduce((productSum, sale) => {
        return productSum + parseFloat(sale.commissionEarned);
      }, 0);
    }, 0);

    const totalRevenue = seller.products.reduce((sum, product) => {
      return sum + product.salesData.reduce((productSum, sale) => {
        return productSum + parseFloat(sale.totalRevenue);
      }, 0);
    }, 0);

    const summary = {
      seller: {
        id: seller.id,
        companyName: seller.companyName,
        contactEmail: seller.contactEmail,
        status: seller.status
      },
      stats: {
        totalProducts,
        activeProducts,
        totalCommission: totalCommission.toFixed(2),
        totalRevenue: totalRevenue.toFixed(2),
        avgCommissionRate: seller.defaultCommissionRate
      },
      recentUploads: seller.uploadBatches
    };

    res.json(summary);
  } catch (error) {
    console.error('Get seller summary error:', error);
    res.status(500).json({ error: 'Failed to fetch seller summary' });
  }
});

module.exports = router;