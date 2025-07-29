# Sellers Backend - Product Plan

## Project Overview
Backend system for media company managing Amazon sellers and their product catalogs with analytics capabilities.

## Target Users
1. **Operations Team** (Phase 1): Internal staff managing seller relationships
2. **Sellers** (Phase 2): Self-serve portal for direct seller management

## Core Functionality

### 1. Seller Management
- CRUD operations for seller profiles
- Contact information and agreement details
- Commission structure management

### 2. Product Data Management
- Monthly product list uploads (CSV/Excel)
- Product fields: ASIN, Market, Commission %, Product Name, Price, Description
- Bulk import validation and error handling
- Product history tracking

### 3. Analytics Dashboard
- Sales volume per product/seller
- Commission calculations and reporting
- Performance metrics and trends
- Export capabilities for financial reporting

## Technical Architecture

### Backend Stack
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth
- **File Processing**: multer + csv-parser
- **API**: RESTful API design

### Database Schema
```
sellers
├── id (UUID)
├── company_name
├── contact_email
├── contact_phone
├── commission_rate (default)
├── status (active/inactive)
├── created_at
└── updated_at

products
├── id (UUID)
├── seller_id (FK)
├── asin
├── market (US, UK, DE, etc.)
├── product_name
├── description
├── price
├── commission_rate
├── upload_batch_id
├── created_at
└── updated_at

sales_data
├── id (UUID)
├── product_id (FK)
├── sale_date
├── quantity_sold
├── revenue
├── commission_earned
├── created_at
└── updated_at

upload_batches
├── id (UUID)
├── seller_id (FK)
├── filename
├── total_products
├── successful_imports
├── failed_imports
├── status
├── created_at
└── updated_at
```

## UI Screens Design

### Screen 1: Seller Product Management
**URL**: `/sellers/:id/products`

**Features**:
- Product list table with search/filter
- Upload new product list (CSV/Excel)
- Edit individual products
- View upload history
- Bulk actions (delete, update commission)

### Screen 2: Seller Analytics Dashboard
**URL**: `/sellers/:id/analytics`

**Features**:
- Revenue overview (monthly/quarterly)
- Top performing products
- Commission breakdown
- Sales trends charts
- Export reports (PDF/Excel)

## API Endpoints

### Sellers
- `GET /api/sellers` - List all sellers
- `POST /api/sellers` - Create new seller
- `GET /api/sellers/:id` - Get seller details
- `PUT /api/sellers/:id` - Update seller
- `DELETE /api/sellers/:id` - Delete seller

### Products
- `GET /api/sellers/:id/products` - List seller products
- `POST /api/sellers/:id/products/upload` - Upload product list
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Analytics
- `GET /api/sellers/:id/analytics/overview` - Sales overview
- `GET /api/sellers/:id/analytics/products` - Product performance
- `GET /api/sellers/:id/analytics/commission` - Commission data
- `POST /api/analytics/reports/export` - Export reports

## Implementation Phases

### Phase 1: Core Backend (Week 1-2)
- Database setup and migrations
- Basic CRUD APIs for sellers/products
- CSV upload functionality
- Basic authentication

### Phase 2: Analytics (Week 3)
- Sales data integration
- Analytics API endpoints
- Dashboard data aggregation
- Export functionality

### Phase 3: UI Development (Week 4-5)
- Frontend React/Vue.js application
- Seller management interface
- Analytics dashboard
- File upload interface

### Phase 4: Advanced Features (Week 6+)
- Role-based permissions
- Seller self-serve portal
- Advanced reporting
- API rate limiting