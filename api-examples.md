# API Testing Examples

## Base URL
```
http://localhost:3000
```

## 1. Basic Endpoints (No Auth Required)

### Get API Information
```
GET http://localhost:3000/
```

### Health Check
```
GET http://localhost:3000/health
```

### Test Features
```
GET http://localhost:3000/api/test
```

### Download CSV Template
```
GET http://localhost:3000/api/upload/template
```

## 2. Authentication Endpoints

### Login (Get Token)
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "password123"
}
```

### Register New User
```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "newuser@company.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "operator"
}
```

## 3. Seller Management (Requires Auth Token)

### List All Sellers
```
GET http://localhost:3000/api/sellers
Authorization: Bearer YOUR_TOKEN_HERE
```

### Create New Seller
```
POST http://localhost:3000/api/sellers
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "companyName": "Test Electronics",
  "contactEmail": "test@electronics.com",
  "contactPhone": "+1-555-0123",
  "contactPerson": "Jane Smith",
  "defaultCommissionRate": 8.0,
  "notes": "New seller for testing"
}
```

## 4. Product Management

### List Products for Seller
```
GET http://localhost:3000/api/products/seller/SELLER_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
```

### Create Single Product
```
POST http://localhost:3000/api/products
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "sellerId": "SELLER_ID_HERE",
  "asin": "B08TEST123",
  "market": "US",
  "productName": "Test Product",
  "description": "A test product for demonstration",
  "price": 29.99,
  "currency": "USD",
  "commissionRate": 8.5
}
```

## 5. File Upload

### Upload CSV Product List
```
POST http://localhost:3000/api/upload/SELLER_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: multipart/form-data

file: [CSV file]
updateExisting: true
```

## 6. Analytics

### Seller Dashboard Data
```
GET http://localhost:3000/api/analytics/seller/SELLER_ID_HERE/dashboard?period=30
Authorization: Bearer YOUR_TOKEN_HERE
```

### Sales Overview
```
GET http://localhost:3000/api/analytics/seller/SELLER_ID_HERE/overview?period=30
Authorization: Bearer YOUR_TOKEN_HERE
```

## How to Use:

1. **First**: Call the login endpoint to get your JWT token
2. **Then**: Use that token in the Authorization header for all other requests
3. **Replace**: SELLER_ID_HERE with actual seller IDs from your database
4. **Replace**: YOUR_TOKEN_HERE with the JWT token from login

## Sample Workflow:

1. Login → Get token
2. Create seller → Get seller ID  
3. Upload products for that seller
4. View analytics for that seller
5. Manage products (edit, delete, bulk operations)