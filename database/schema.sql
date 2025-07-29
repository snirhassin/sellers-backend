-- Sellers Backend Database Schema
-- PostgreSQL Database Setup

-- Create database
-- CREATE DATABASE sellers_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sellers table
CREATE TABLE sellers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) UNIQUE NOT NULL,
    contact_phone VARCHAR(50),
    contact_person VARCHAR(255),
    default_commission_rate DECIMAL(5,2) DEFAULT 7.50, -- Default 7.5%
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Upload batches table (tracks CSV uploads)
CREATE TABLE upload_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    total_rows INTEGER NOT NULL DEFAULT 0,
    successful_imports INTEGER NOT NULL DEFAULT 0,
    failed_imports INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    error_log TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    upload_batch_id UUID REFERENCES upload_batches(id) ON DELETE SET NULL,
    asin VARCHAR(20) NOT NULL,
    market VARCHAR(10) NOT NULL, -- US, UK, DE, FR, IT, ES, CA, JP, etc.
    product_name VARCHAR(500) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    commission_rate DECIMAL(5,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Composite unique constraint for ASIN + Market + Seller
    UNIQUE(seller_id, asin, market)
);

-- Sales data table (for analytics)
CREATE TABLE sales_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sale_date DATE NOT NULL,
    quantity_sold INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_revenue DECIMAL(12,2) NOT NULL,
    commission_earned DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    order_id VARCHAR(100), -- Amazon order ID if available
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table (for authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'seller')),
    seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_asin ON products(asin);
CREATE INDEX idx_products_market ON products(market);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_at ON products(created_at);

CREATE INDEX idx_sales_data_product_id ON sales_data(product_id);
CREATE INDEX idx_sales_data_sale_date ON sales_data(sale_date);
CREATE INDEX idx_sales_data_created_at ON sales_data(created_at);

CREATE INDEX idx_upload_batches_seller_id ON upload_batches(seller_id);
CREATE INDEX idx_upload_batches_status ON upload_batches(status);
CREATE INDEX idx_upload_batches_created_at ON upload_batches(created_at);

CREATE INDEX idx_sellers_status ON sellers(status);
CREATE INDEX idx_sellers_email ON sellers(contact_email);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON sellers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_upload_batches_updated_at BEFORE UPDATE ON upload_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO sellers (company_name, contact_email, contact_phone, contact_person, default_commission_rate) VALUES
('ABC Electronics', 'contact@abcelectronics.com', '+1-555-0123', 'John Smith', 8.50),
('Tech Solutions Ltd', 'info@techsolutions.co.uk', '+44-20-7946-0958', 'Sarah Johnson', 7.25),
('Digital Gadgets Inc', 'sales@digitalgadgets.com', '+1-555-0199', 'Mike Chen', 9.00);

-- Sample products
INSERT INTO products (seller_id, asin, market, product_name, description, price, commission_rate) 
SELECT 
    s.id,
    'B08N5WRWNW',
    'US',
    'Wireless Bluetooth Earbuds',
    'Premium quality wireless earbuds with noise cancellation',
    29.99,
    8.50
FROM sellers s WHERE s.company_name = 'ABC Electronics';

INSERT INTO products (seller_id, asin, market, product_name, description, price, commission_rate) 
SELECT 
    s.id,
    'B07XJ8C8F7',
    'UK',
    'USB-C Fast Charger',
    'Quick charging USB-C adapter for smartphones',
    15.99,
    7.00
FROM sellers s WHERE s.company_name = 'ABC Electronics';

-- Sample sales data
INSERT INTO sales_data (product_id, sale_date, quantity_sold, unit_price, total_revenue, commission_earned)
SELECT 
    p.id,
    CURRENT_DATE - INTERVAL '1 day',
    2,
    29.99,
    59.98,
    5.10
FROM products p WHERE p.asin = 'B08N5WRWNW';

-- Views for common queries
CREATE VIEW seller_summary AS
SELECT 
    s.id,
    s.company_name,
    s.contact_email,
    s.status,
    COUNT(p.id) as total_products,
    COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_products,
    COALESCE(SUM(sd.commission_earned), 0) as total_commission,
    s.created_at
FROM sellers s
LEFT JOIN products p ON s.id = p.seller_id
LEFT JOIN sales_data sd ON p.id = sd.product_id
GROUP BY s.id, s.company_name, s.contact_email, s.status, s.created_at;

CREATE VIEW product_performance AS
SELECT 
    p.id,
    p.seller_id,
    s.company_name,
    p.asin,
    p.market,
    p.product_name,
    p.price,
    p.commission_rate,
    COALESCE(SUM(sd.quantity_sold), 0) as total_units_sold,
    COALESCE(SUM(sd.total_revenue), 0) as total_revenue,
    COALESCE(SUM(sd.commission_earned), 0) as total_commission,
    p.created_at
FROM products p
JOIN sellers s ON p.seller_id = s.id
LEFT JOIN sales_data sd ON p.id = sd.product_id
GROUP BY p.id, p.seller_id, s.company_name, p.asin, p.market, p.product_name, p.price, p.commission_rate, p.created_at;