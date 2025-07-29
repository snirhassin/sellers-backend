const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const seller1 = await prisma.seller.create({
    data: {
      companyName: 'ABC Electronics',
      contactEmail: 'contact@abcelectronics.com',
      contactPhone: '+1-555-0123',
      contactPerson: 'John Smith',
      defaultCommissionRate: 8.5,
      status: 'active',
      notes: 'Premium electronics seller with high volume',
    },
  });

  const seller2 = await prisma.seller.create({
    data: {
      companyName: 'Tech Solutions Ltd',
      contactEmail: 'info@techsolutions.co.uk',
      contactPhone: '+44-20-7946-0958',
      contactPerson: 'Sarah Johnson',
      defaultCommissionRate: 7.25,
      status: 'active',
    },
  });

  const seller3 = await prisma.seller.create({
    data: {
      companyName: 'Digital Gadgets Inc',
      contactEmail: 'sales@digitalgadgets.com',
      contactPhone: '+1-555-0199',
      contactPerson: 'Mike Chen',
      defaultCommissionRate: 9.0,
      status: 'active',
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@company.com',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'operator@company.com',
      passwordHash: hashedPassword,
      firstName: 'Operation',
      lastName: 'Manager',
      role: 'operator',
      isActive: true,
    },
  });

  // Create custom user
  const customHashedPassword = await bcrypt.hash('moty22', 10);
  await prisma.user.create({
    data: {
      email: 'snir.hassin@gmail.com',
      passwordHash: customHashedPassword,
      firstName: 'Snir',
      lastName: 'Hassin',
      role: 'admin',
      isActive: true,
    },
  });

  const uploadBatch1 = await prisma.uploadBatch.create({
    data: {
      sellerId: seller1.id,
      filename: 'products_jan_2024.csv',
      originalFilename: 'products_jan_2024.csv',
      totalRows: 245,
      successfulImports: 245,
      failedImports: 0,
      status: 'completed',
    },
  });

  const products = [
    {
      sellerId: seller1.id,
      uploadBatchId: uploadBatch1.id,
      asin: 'B08N5WRWNW',
      market: 'US',
      productName: 'Wireless Bluetooth Earbuds',
      description: 'Premium quality wireless earbuds with noise cancellation and long battery life',
      price: 29.99,
      currency: 'USD',
      commissionRate: 8.5,
      status: 'active',
    },
    {
      sellerId: seller1.id,
      uploadBatchId: uploadBatch1.id,
      asin: 'B07XJ8C8F7',
      market: 'UK',
      productName: 'USB-C Fast Charger',
      description: 'Quick charging USB-C adapter for smartphones and tablets',
      price: 15.99,
      currency: 'GBP',
      commissionRate: 7.0,
      status: 'active',
    },
    {
      sellerId: seller1.id,
      uploadBatchId: uploadBatch1.id,
      asin: 'B09KXJM2P3',
      market: 'DE',
      productName: 'Bluetooth Speaker',
      description: 'Portable wireless speaker with excellent sound quality',
      price: 45.50,
      currency: 'EUR',
      commissionRate: 9.2,
      status: 'active',
    },
    {
      sellerId: seller1.id,
      uploadBatchId: uploadBatch1.id,
      asin: 'B08HLQD2J6',
      market: 'US',
      productName: 'USB Cable 3-Pack',
      description: 'Durable USB cables for charging and data transfer',
      price: 12.99,
      currency: 'USD',
      commissionRate: 6.5,
      status: 'active',
    },
    {
      sellerId: seller2.id,
      asin: 'B09XYZ1234',
      market: 'UK',
      productName: 'Smartphone Case',
      description: 'Protective case for popular smartphone models',
      price: 19.99,
      currency: 'GBP',
      commissionRate: 7.25,
      status: 'active',
    },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  const product1 = await prisma.product.findFirst({
    where: { asin: 'B08N5WRWNW' },
  });

  const product2 = await prisma.product.findFirst({
    where: { asin: 'B07XJ8C8F7' },
  });

  const salesData = [
    {
      productId: product1.id,
      saleDate: new Date('2024-01-15'),
      quantitySold: 2,
      unitPrice: 29.99,
      totalRevenue: 59.98,
      commissionEarned: 5.10,
      currency: 'USD',
      orderId: 'AMZ-001-123456',
    },
    {
      productId: product1.id,
      saleDate: new Date('2024-01-16'),
      quantitySold: 1,
      unitPrice: 29.99,
      totalRevenue: 29.99,
      commissionEarned: 2.55,
      currency: 'USD',
      orderId: 'AMZ-001-123457',
    },
    {
      productId: product2.id,
      saleDate: new Date('2024-01-15'),
      quantitySold: 3,
      unitPrice: 15.99,
      totalRevenue: 47.97,
      commissionEarned: 3.36,
      currency: 'GBP',
      orderId: 'AMZ-UK-789012',
    },
  ];

  for (const sale of salesData) {
    await prisma.salesData.create({ data: sale });
  }

  console.log('Database seeded successfully!');
  console.log('Created sellers:', await prisma.seller.count());
  console.log('Created products:', await prisma.product.count());
  console.log('Created sales records:', await prisma.salesData.count());
  console.log('Created users:', await prisma.user.count());
  console.log('\nDefault login credentials:');
  console.log('Admin: admin@company.com / password123');
  console.log('Operator: operator@company.com / password123');
  console.log('Custom Admin: snir.hassin@gmail.com / moty22');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });