const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, sellerMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/seller/:sellerId/overview', authMiddleware, sellerMiddleware, async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { startDate, endDate, period = '30' } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        saleDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    } else {
      const daysAgo = parseInt(period);
      dateFilter = {
        saleDate: {
          gte: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        }
      };
    }

    const salesData = await prisma.salesData.findMany({
      where: {
        product: {
          sellerId
        },
        ...dateFilter
      },
      include: {
        product: {
          select: {
            productName: true,
            asin: true,
            market: true,
            currency: true
          }
        }
      }
    });

    const totalRevenue = salesData.reduce((sum, sale) => sum + parseFloat(sale.totalRevenue), 0);
    const totalCommission = salesData.reduce((sum, sale) => sum + parseFloat(sale.commissionEarned), 0);
    const totalUnits = salesData.reduce((sum, sale) => sum + sale.quantitySold, 0);
    const uniqueProducts = new Set(salesData.map(sale => sale.productId)).size;
    const avgOrderValue = totalUnits > 0 ? totalRevenue / salesData.length : 0;

    const dailySales = salesData.reduce((acc, sale) => {
      const date = sale.saleDate.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { revenue: 0, units: 0, commission: 0 };
      }
      acc[date].revenue += parseFloat(sale.totalRevenue);
      acc[date].units += sale.quantitySold;
      acc[date].commission += parseFloat(sale.commissionEarned);
      return acc;
    }, {});

    const trendData = Object.entries(dailySales)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        ...data
      }));

    res.json({
      summary: {
        totalRevenue: totalRevenue.toFixed(2),
        totalCommission: totalCommission.toFixed(2),
        totalUnits,
        uniqueProducts,
        avgOrderValue: avgOrderValue.toFixed(2),
        period: `${period} days`
      },
      trendData,
      salesCount: salesData.length
    });
  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

router.get('/seller/:sellerId/products', authMiddleware, sellerMiddleware, async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { startDate, endDate, period = '30', limit = 10 } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        saleDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    } else {
      const daysAgo = parseInt(period);
      dateFilter = {
        saleDate: {
          gte: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        }
      };
    }

    const productPerformance = await prisma.product.findMany({
      where: { sellerId },
      include: {
        salesData: {
          where: dateFilter,
        }
      }
    });

    const performanceData = productPerformance
      .map(product => {
        const sales = product.salesData;
        const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.totalRevenue), 0);
        const totalCommission = sales.reduce((sum, sale) => sum + parseFloat(sale.commissionEarned), 0);
        const totalUnits = sales.reduce((sum, sale) => sum + sale.quantitySold, 0);
        const salesCount = sales.length;

        return {
          id: product.id,
          asin: product.asin,
          productName: product.productName,
          market: product.market,
          price: product.price,
          commissionRate: product.commissionRate,
          totalRevenue: totalRevenue.toFixed(2),
          totalCommission: totalCommission.toFixed(2),
          totalUnits,
          salesCount,
          avgUnitPrice: totalUnits > 0 ? (totalRevenue / totalUnits).toFixed(2) : '0.00'
        };
      })
      .sort((a, b) => parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue))
      .slice(0, parseInt(limit));

    res.json(performanceData);
  } catch (error) {
    console.error('Get product analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch product analytics' });
  }
});

router.get('/seller/:sellerId/commission', authMiddleware, sellerMiddleware, async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { startDate, endDate, period = '30' } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        saleDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    } else {
      const daysAgo = parseInt(period);
      dateFilter = {
        saleDate: {
          gte: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        }
      };
    }

    const salesData = await prisma.salesData.findMany({
      where: {
        product: {
          sellerId
        },
        ...dateFilter
      },
      include: {
        product: {
          select: {
            commissionRate: true,
            market: true
          }
        }
      }
    });

    const totalCommission = salesData.reduce((sum, sale) => sum + parseFloat(sale.commissionEarned), 0);
    
    const commissionByRate = salesData.reduce((acc, sale) => {
      const rate = parseFloat(sale.product.commissionRate);
      const rateRange = rate < 7 ? '5-7%' : rate < 8 ? '7-8%' : rate < 9 ? '8-9%' : '9%+';
      
      if (!acc[rateRange]) {
        acc[rateRange] = { commission: 0, count: 0 };
      }
      
      acc[rateRange].commission += parseFloat(sale.commissionEarned);
      acc[rateRange].count += 1;
      return acc;
    }, {});

    const commissionByMarket = salesData.reduce((acc, sale) => {
      const market = sale.product.market;
      if (!acc[market]) {
        acc[market] = { commission: 0, count: 0 };
      }
      acc[market].commission += parseFloat(sale.commissionEarned);
      acc[market].count += 1;
      return acc;
    }, {});

    const monthlyCommission = salesData.reduce((acc, sale) => {
      const month = sale.saleDate.toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += parseFloat(sale.commissionEarned);
      return acc;
    }, {});

    const avgCommissionRate = salesData.length > 0 
      ? (salesData.reduce((sum, sale) => sum + parseFloat(sale.product.commissionRate), 0) / salesData.length).toFixed(2)
      : '0.00';

    res.json({
      totalCommission: totalCommission.toFixed(2),
      avgCommissionRate,
      commissionByRate: Object.entries(commissionByRate).map(([range, data]) => ({
        range,
        commission: data.commission.toFixed(2),
        percentage: ((data.commission / totalCommission) * 100).toFixed(1)
      })),
      commissionByMarket: Object.entries(commissionByMarket).map(([market, data]) => ({
        market,
        commission: data.commission.toFixed(2),
        count: data.count
      })),
      monthlyTrend: Object.entries(monthlyCommission)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, commission]) => ({
          month,
          commission: commission.toFixed(2)
        }))
    });
  } catch (error) {
    console.error('Get commission analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch commission analytics' });
  }
});

router.get('/seller/:sellerId/markets', authMiddleware, sellerMiddleware, async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { startDate, endDate, period = '30' } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        saleDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    } else {
      const daysAgo = parseInt(period);
      dateFilter = {
        saleDate: {
          gte: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        }
      };
    }

    const marketData = await prisma.product.findMany({
      where: { sellerId },
      include: {
        salesData: {
          where: dateFilter
        }
      }
    });

    const marketPerformance = marketData.reduce((acc, product) => {
      const market = product.market;
      if (!acc[market]) {
        acc[market] = {
          market,
          products: 0,
          totalRevenue: 0,
          totalCommission: 0,
          totalUnits: 0,
          avgCommissionRate: 0
        };
      }

      acc[market].products += 1;
      
      const sales = product.salesData;
      const revenue = sales.reduce((sum, sale) => sum + parseFloat(sale.totalRevenue), 0);
      const commission = sales.reduce((sum, sale) => sum + parseFloat(sale.commissionEarned), 0);
      const units = sales.reduce((sum, sale) => sum + sale.quantitySold, 0);

      acc[market].totalRevenue += revenue;
      acc[market].totalCommission += commission;
      acc[market].totalUnits += units;
      acc[market].avgCommissionRate += parseFloat(product.commissionRate);

      return acc;
    }, {});

    Object.values(marketPerformance).forEach(market => {
      market.avgCommissionRate = (market.avgCommissionRate / market.products).toFixed(2);
      market.totalRevenue = market.totalRevenue.toFixed(2);
      market.totalCommission = market.totalCommission.toFixed(2);
    });

    const sortedMarkets = Object.values(marketPerformance)
      .sort((a, b) => parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue));

    res.json(sortedMarkets);
  } catch (error) {
    console.error('Get market analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch market analytics' });
  }
});

router.get('/seller/:sellerId/dashboard', authMiddleware, sellerMiddleware, async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { period = '30' } = req.query;
    
    const daysAgo = parseInt(period);
    const currentPeriodStart = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(Date.now() - (daysAgo * 2) * 24 * 60 * 60 * 1000);
    const previousPeriodEnd = currentPeriodStart;

    const [
      currentPeriodSales,
      previousPeriodSales,
      totalProducts,
      activeProducts,
      recentActivity
    ] = await Promise.all([
      prisma.salesData.findMany({
        where: {
          product: { sellerId },
          saleDate: { gte: currentPeriodStart }
        },
        include: {
          product: {
            select: {
              productName: true,
              asin: true,
              market: true
            }
          }
        }
      }),
      prisma.salesData.findMany({
        where: {
          product: { sellerId },
          saleDate: {
            gte: previousPeriodStart,
            lt: previousPeriodEnd
          }
        }
      }),
      prisma.product.count({
        where: { sellerId }
      }),
      prisma.product.count({
        where: { sellerId, status: 'active' }
      }),
      prisma.salesData.findMany({
        where: {
          product: { sellerId }
        },
        include: {
          product: {
            select: {
              productName: true,
              asin: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    const currentRevenue = currentPeriodSales.reduce((sum, sale) => sum + parseFloat(sale.totalRevenue), 0);
    const currentCommission = currentPeriodSales.reduce((sum, sale) => sum + parseFloat(sale.commissionEarned), 0);
    const currentUnits = currentPeriodSales.reduce((sum, sale) => sum + sale.quantitySold, 0);

    const previousRevenue = previousPeriodSales.reduce((sum, sale) => sum + parseFloat(sale.totalRevenue), 0);
    const previousCommission = previousPeriodSales.reduce((sum, sale) => sum + parseFloat(sale.commissionEarned), 0);

    const revenueGrowth = previousRevenue > 0 
      ? (((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)
      : '0.0';

    const commissionGrowth = previousCommission > 0
      ? (((currentCommission - previousCommission) / previousCommission) * 100).toFixed(1)
      : '0.0';

    const topProducts = currentPeriodSales
      .reduce((acc, sale) => {
        const key = sale.product.asin;
        if (!acc[key]) {
          acc[key] = {
            asin: sale.product.asin,
            productName: sale.product.productName,
            market: sale.product.market,
            revenue: 0,
            units: 0,
            salesCount: 0
          };
        }
        acc[key].revenue += parseFloat(sale.totalRevenue);
        acc[key].units += sale.quantitySold;
        acc[key].salesCount += 1;
        return acc;
      }, {});

    const sortedTopProducts = Object.values(topProducts)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(product => ({
        ...product,
        revenue: product.revenue.toFixed(2)
      }));

    res.json({
      summary: {
        currentPeriod: {
          revenue: currentRevenue.toFixed(2),
          commission: currentCommission.toFixed(2),
          units: currentUnits,
          salesCount: currentPeriodSales.length
        },
        previousPeriod: {
          revenue: previousRevenue.toFixed(2),
          commission: previousCommission.toFixed(2)
        },
        growth: {
          revenue: revenueGrowth,
          commission: commissionGrowth
        },
        products: {
          total: totalProducts,
          active: activeProducts
        }
      },
      topProducts: sortedTopProducts,
      recentActivity: recentActivity.map(sale => ({
        id: sale.id,
        productName: sale.product.productName,
        asin: sale.product.asin,
        quantity: sale.quantitySold,
        revenue: parseFloat(sale.totalRevenue).toFixed(2),
        commission: parseFloat(sale.commissionEarned).toFixed(2),
        saleDate: sale.saleDate,
        createdAt: sale.createdAt
      }))
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

router.post('/seller/:sellerId/export', authMiddleware, sellerMiddleware, async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { type, startDate, endDate, format = 'csv' } = req.body;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        saleDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    }

    let data = [];
    let filename = '';

    switch (type) {
      case 'sales':
        data = await prisma.salesData.findMany({
          where: {
            product: { sellerId },
            ...dateFilter
          },
          include: {
            product: {
              select: {
                asin: true,
                productName: true,
                market: true,
                commissionRate: true
              }
            }
          },
          orderBy: { saleDate: 'desc' }
        });
        filename = `sales_report_${sellerId}`;
        break;

      case 'products':
        data = await prisma.product.findMany({
          where: { sellerId },
          include: {
            salesData: {
              where: dateFilter
            }
          }
        });
        filename = `products_report_${sellerId}`;
        break;

      case 'commission':
        data = await prisma.salesData.findMany({
          where: {
            product: { sellerId },
            ...dateFilter
          },
          include: {
            product: {
              select: {
                asin: true,
                productName: true,
                market: true,
                commissionRate: true
              }
            }
          },
          orderBy: { saleDate: 'desc' }
        });
        filename = `commission_report_${sellerId}`;
        break;
    }

    res.json({
      message: 'Export data prepared',
      recordCount: data.length,
      filename: `${filename}_${new Date().toISOString().split('T')[0]}.${format}`,
      data: data.slice(0, 100) // Return first 100 records for preview
    });
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ error: 'Failed to export analytics data' });
  }
});

module.exports = router;