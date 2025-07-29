# Sellers Backend API

A comprehensive backend system for managing Amazon sellers, their product catalogs, and sales analytics. Built for media companies working directly with Amazon sellers.

## Features

- **Seller Management**: Complete CRUD operations for seller profiles
- **Product Management**: Bulk product uploads via CSV with validation
- **Analytics Dashboard**: Sales performance, commission tracking, and reporting
- **Authentication**: JWT-based authentication with role-based access
- **File Upload**: CSV/Excel product list processing with error handling
- **Multi-market Support**: US, UK, DE, and other Amazon marketplaces

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt
- **File Processing**: Multer + CSV parser
- **Security**: CORS, input validation, role-based permissions

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- npm or yarn

### Installation

1. Clone and setup:
```bash
cd sellers-backend
npm install
```

2. Environment setup:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Database setup:
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed with sample data
```

4. Start development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `GET /api/auth/me` - Get current user info

### Sellers
- `GET /api/sellers` - List all sellers (paginated)
- `POST /api/sellers` - Create new seller
- `GET /api/sellers/:id` - Get seller details
- `PUT /api/sellers/:id` - Update seller
- `DELETE /api/sellers/:id` - Delete/deactivate seller
- `GET /api/sellers/:id/summary` - Get seller stats summary

### Products
- `GET /api/products/seller/:sellerId` - List seller products (with filters)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create single product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete/discontinue product
- `POST /api/products/bulk-update` - Bulk update products
- `DELETE /api/products/bulk-delete` - Bulk delete products

### File Upload
- `POST /api/upload/:sellerId` - Upload CSV product list
- `GET /api/upload/history/:sellerId` - Get upload history
- `GET /api/upload/batch/:batchId` - Get upload batch details
- `GET /api/upload/template` - Download CSV template

### Analytics
- `GET /api/analytics/seller/:sellerId/overview` - Sales overview
- `GET /api/analytics/seller/:sellerId/products` - Product performance
- `GET /api/analytics/seller/:sellerId/commission` - Commission analytics
- `GET /api/analytics/seller/:sellerId/markets` - Market performance
- `GET /api/analytics/seller/:sellerId/dashboard` - Dashboard data
- `POST /api/analytics/seller/:sellerId/export` - Export reports

## Database Schema

### Core Tables
- **sellers**: Company information, contact details, commission rates
- **products**: ASIN, market, pricing, commission data
- **sales_data**: Transaction records for analytics
- **upload_batches**: CSV upload tracking and error logs
- **users**: Authentication and role management

## CSV Upload Format

Required columns:
- `asin`: Product ASIN (10 characters, alphanumeric)
- `market`: Marketplace (US, UK, DE, etc.)
- `product_name`: Product title
- `commission_rate`: Commission percentage (0-50)

Optional columns:
- `description`: Product description
- `price`: Product price
- `currency`: Currency code (USD, GBP, EUR)

Download template: `GET /api/upload/template`

## Authentication & Roles

### User Roles
- **admin**: Full system access
- **operator**: Manage sellers and products (operations team)
- **seller**: Access only own data (future self-serve portal)

### JWT Token
Include in headers: `Authorization: Bearer <token>`

## Sample Usage

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"password123"}'
```

### Upload Products
```bash
curl -X POST http://localhost:3000/api/upload/:sellerId \
  -H "Authorization: Bearer <token>" \
  -F "file=@products.csv" \
  -F "updateExisting=true"
```

### Get Analytics
```bash
curl -X GET "http://localhost:3000/api/analytics/seller/:sellerId/dashboard?period=30" \
  -H "Authorization: Bearer <token>"
```

## Development

### Database Commands
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Create migration
npm run db:seed      # Seed sample data
```

### Default Users (from seed)
- Admin: `admin@company.com` / `password123`
- Operator: `operator@company.com` / `password123`

## Error Handling

The API returns consistent error responses:
```json
{
  "error": "Error message",
  "message": "Detailed description"
}
```

HTTP status codes follow REST conventions (200, 201, 400, 401, 403, 404, 500).

## File Structure

```
src/
├── routes/          # API route handlers
├── middleware/      # Authentication & validation
├── server.js        # Express app setup
prisma/
├── schema.prisma    # Database schema
├── seed.js          # Sample data
database/
├── schema.sql       # Raw SQL schema
uploads/             # Temporary CSV uploads
```

## Production Deployment

1. Set production environment variables
2. Run database migrations
3. Configure PostgreSQL connection
4. Set up file upload storage (AWS S3, etc.)
5. Configure CORS for frontend domain
6. Set up SSL/HTTPS
7. Configure logging and monitoring

## Support

For issues and feature requests, refer to the project documentation or contact the development team.