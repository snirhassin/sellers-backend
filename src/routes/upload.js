const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, operatorMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.csv', '.xlsx', '.xls'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and Excel files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const validateProductRow = (row, rowIndex) => {
  const errors = [];
  
  if (!row.asin || row.asin.trim().length === 0) {
    errors.push(`Row ${rowIndex}: ASIN is required`);
  } else if (!/^[A-Z0-9]{10}$/.test(row.asin.trim())) {
    errors.push(`Row ${rowIndex}: Invalid ASIN format (should be 10 alphanumeric characters)`);
  }
  
  if (!row.market || row.market.trim().length === 0) {
    errors.push(`Row ${rowIndex}: Market is required`);
  }
  
  if (!row.productName || row.productName.trim().length === 0) {
    errors.push(`Row ${rowIndex}: Product name is required`);
  }
  
  if (!row.commissionRate || isNaN(parseFloat(row.commissionRate))) {
    errors.push(`Row ${rowIndex}: Valid commission rate is required`);
  } else {
    const rate = parseFloat(row.commissionRate);
    if (rate < 0 || rate > 50) {
      errors.push(`Row ${rowIndex}: Commission rate must be between 0% and 50%`);
    }
  }
  
  if (row.price && row.price.trim() !== '' && isNaN(parseFloat(row.price))) {
    errors.push(`Row ${rowIndex}: Price must be a valid number`);
  }
  
  return errors;
};

const processCSVFile = (filePath, sellerId) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let rowIndex = 0;

    fs.createReadStream(filePath)
      .pipe(csv({
        mapHeaders: ({ header }) => {
          const headerMap = {
            'asin': 'asin',
            'asin_code': 'asin',
            'product_asin': 'asin',
            'market': 'market',
            'marketplace': 'market',
            'market_place': 'market',
            'product_name': 'productName',
            'productname': 'productName',
            'name': 'productName',
            'title': 'productName',
            'description': 'description',
            'product_description': 'description',
            'price': 'price',
            'product_price': 'price',
            'commission': 'commissionRate',
            'commission_rate': 'commissionRate',
            'commission_percent': 'commissionRate',
            'currency': 'currency'
          };
          
          const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
          return headerMap[normalizedHeader] || header;
        }
      }))
      .on('data', (row) => {
        rowIndex++;
        
        const cleanRow = {
          asin: row.asin?.trim()?.toUpperCase(),
          market: row.market?.trim()?.toUpperCase(),
          productName: row.productName?.trim(),
          description: row.description?.trim() || null,
          price: row.price?.trim() ? parseFloat(row.price.trim()) : null,
          currency: row.currency?.trim()?.toUpperCase() || 'USD',
          commissionRate: row.commissionRate?.trim() ? parseFloat(row.commissionRate.trim()) : null,
          sellerId
        };
        
        const rowErrors = validateProductRow(cleanRow, rowIndex);
        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
        } else {
          results.push(cleanRow);
        }
      })
      .on('end', () => {
        resolve({ products: results, errors, totalRows: rowIndex });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

router.post('/:sellerId', authMiddleware, operatorMiddleware, upload.single('file'), async (req, res) => {
  let uploadBatch = null;
  
  try {
    const { sellerId } = req.params;
    const { updateExisting = false } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const seller = await prisma.seller.findUnique({
      where: { id: sellerId }
    });

    if (!seller) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Seller not found' });
    }

    uploadBatch = await prisma.uploadBatch.create({
      data: {
        sellerId,
        filename: req.file.filename,
        originalFilename: req.file.originalname,
        status: 'processing'
      }
    });

    const { products, errors, totalRows } = await processCSVFile(req.file.path, sellerId);
    
    await prisma.uploadBatch.update({
      where: { id: uploadBatch.id },
      data: { totalRows }
    });

    if (errors.length > 0 && products.length === 0) {
      await prisma.uploadBatch.update({
        where: { id: uploadBatch.id },
        data: {
          status: 'failed',
          failedImports: totalRows,
          errorLog: errors.join('\n')
        }
      });

      fs.unlinkSync(req.file.path);
      
      return res.status(400).json({
        error: 'All rows failed validation',
        errors,
        summary: {
          totalRows,
          successful: 0,
          failed: totalRows
        }
      });
    }

    let successfulImports = 0;
    const importErrors = [...errors];

    for (let i = 0; i < products.length; i++) {
      try {
        const product = products[i];
        
        const existingProduct = await prisma.product.findUnique({
          where: {
            sellerId_asin_market: {
              sellerId: product.sellerId,
              asin: product.asin,
              market: product.market
            }
          }
        });

        if (existingProduct) {
          if (updateExisting === 'true' || updateExisting === true) {
            await prisma.product.update({
              where: { id: existingProduct.id },
              data: {
                productName: product.productName,
                description: product.description,
                price: product.price,
                currency: product.currency,
                commissionRate: product.commissionRate,
                uploadBatchId: uploadBatch.id
              }
            });
            successfulImports++;
          } else {
            importErrors.push(`Product with ASIN ${product.asin} in market ${product.market} already exists`);
          }
        } else {
          await prisma.product.create({
            data: {
              ...product,
              uploadBatchId: uploadBatch.id,
              status: 'active'
            }
          });
          successfulImports++;
        }
      } catch (error) {
        importErrors.push(`Failed to import product ${products[i].asin}: ${error.message}`);
      }
    }

    const failedImports = totalRows - successfulImports;

    await prisma.uploadBatch.update({
      where: { id: uploadBatch.id },
      data: {
        status: failedImports === 0 ? 'completed' : 'completed',
        successfulImports,
        failedImports,
        errorLog: importErrors.length > 0 ? importErrors.join('\n') : null
      }
    });

    fs.unlinkSync(req.file.path);

    res.json({
      message: 'Upload completed',
      uploadBatchId: uploadBatch.id,
      summary: {
        totalRows,
        successful: successfulImports,
        failed: failedImports
      },
      errors: importErrors.length > 0 ? importErrors : null
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    if (uploadBatch) {
      await prisma.uploadBatch.update({
        where: { id: uploadBatch.id },
        data: {
          status: 'failed',
          errorLog: error.message
        }
      }).catch(console.error);
    }
    
    res.status(500).json({ error: 'Upload failed', message: error.message });
  }
});

router.get('/history/:sellerId', authMiddleware, async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (req.user.role === 'seller' && req.user.sellerId !== sellerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [batches, total] = await Promise.all([
      prisma.uploadBatch.findMany({
        where: { sellerId },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.uploadBatch.count({ where: { sellerId } })
    ]);

    res.json({
      batches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get upload history error:', error);
    res.status(500).json({ error: 'Failed to fetch upload history' });
  }
});

router.get('/batch/:batchId', authMiddleware, async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await prisma.uploadBatch.findUnique({
      where: { id: batchId },
      include: {
        seller: {
          select: {
            companyName: true
          }
        }
      }
    });

    if (!batch) {
      return res.status(404).json({ error: 'Upload batch not found' });
    }

    if (req.user.role === 'seller' && req.user.sellerId !== batch.sellerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(batch);
  } catch (error) {
    console.error('Get upload batch error:', error);
    res.status(500).json({ error: 'Failed to fetch upload batch' });
  }
});

router.get('/template', (req, res) => {
  const templateData = [
    {
      asin: 'B08N5WRWNW',
      market: 'US',
      product_name: 'Wireless Bluetooth Earbuds',
      description: 'Premium quality wireless earbuds with noise cancellation',
      price: 29.99,
      currency: 'USD',
      commission_rate: 8.5
    },
    {
      asin: 'B07XJ8C8F7',
      market: 'UK',
      product_name: 'USB-C Fast Charger',
      description: 'Quick charging USB-C adapter',
      price: 15.99,
      currency: 'GBP',
      commission_rate: 7.0
    }
  ];

  const csvContent = [
    'asin,market,product_name,description,price,currency,commission_rate',
    ...templateData.map(item => 
      `${item.asin},${item.market},"${item.product_name}","${item.description}",${item.price},${item.currency},${item.commission_rate}`
    )
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=product_upload_template.csv');
  res.send(csvContent);
});

module.exports = router;