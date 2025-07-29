import React, { useState, useEffect } from 'react';

interface Product {
  id: string;
  asin: string;
  market: string;
  productName: string;
  description?: string;
  price?: number;
  currency: string;
  commissionRate: number;
  status: string;
  createdAt: string;
  seller?: {
    companyName: string;
  };
}

interface ProductsViewProps {
  token: string;
  sellerId: string | null;
  onBack: () => void;
}

const ProductsView: React.FC<ProductsViewProps> = ({ token, sellerId, onBack }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [marketFilter, setMarketFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sellerName, setSellerName] = useState('');

  useEffect(() => {
    if (sellerId) {
      fetchProducts();
      fetchSellerInfo();
    }
  }, [sellerId]);

  const fetchProducts = async () => {
    if (!sellerId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/products/seller/${sellerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      setError('Network error. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerInfo = async () => {
    if (!sellerId) return;
    
    try {
      const response = await fetch(`/api/sellers/${sellerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSellerName(data.companyName);
      }
    } catch (err) {
      console.error('Failed to fetch seller info');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.asin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMarket = marketFilter === 'all' || product.market === marketFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesMarket && matchesStatus;
  });

  const uniqueMarkets = products.reduce((markets: string[], product) => {
    if (!markets.includes(product.market)) {
      markets.push(product.market);
    }
    return markets;
  }, []);
  const totalRevenue = filteredProducts.reduce((sum, p) => sum + (p.price || 0), 0);
  const avgCommission = products.length > 0 
    ? (products.reduce((sum, p) => sum + p.commissionRate, 0) / products.length).toFixed(1)
    : 0;

  if (!sellerId) {
    return (
      <div className="card">
        <div className="card-content">
          <p>Please select a seller first.</p>
          <button onClick={onBack} className="btn btn-primary">
            ← Back to Sellers
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Back Button and Seller Info */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button onClick={onBack} className="btn btn-secondary">
          ← Back to Sellers
        </button>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>
          🏢 {sellerName || 'Seller Products'}
        </h2>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{products.length}</div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{products.filter(p => p.status === 'active').length}</div>
          <div className="stat-label">Active Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{uniqueMarkets.length}</div>
          <div className="stat-label">Markets</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{avgCommission}%</div>
          <div className="stat-label">Avg Commission</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3>📤 Quick Actions</h3>
        </div>
        <div className="card-content">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="btn btn-success">
              📁 Upload CSV
            </button>
            <button className="btn btn-primary">
              ➕ Add Product
            </button>
            <button className="btn btn-secondary">
              📊 Export Data
            </button>
            <div style={{ marginLeft: 'auto', fontSize: '14px', color: '#7f8c8d' }}>
              Last Upload: Jan 15, 2024
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-header">
          <h3>Search & Filter</h3>
        </div>
        <div className="card-content">
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search by ASIN or product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <select
                value={marketFilter}
                onChange={(e) => setMarketFilter(e.target.value)}
                style={{
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Markets</option>
                {uniqueMarkets.map(market => (
                  <option key={market} value={market}>{market}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
            <button onClick={fetchProducts} className="btn btn-primary">
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="card-header">
          <h3>Products ({filteredProducts.length})</h3>
        </div>
        <div className="card-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
              {products.length === 0 ? (
                <>
                  <p>📦 No products found for this seller.</p>
                  <p>Upload a CSV file to add products.</p>
                </>
              ) : (
                <p>No products match your search criteria.</p>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ASIN</th>
                    <th>Product Name</th>
                    <th>Market</th>
                    <th>Price</th>
                    <th>Commission</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px', borderRadius: '3px' }}>
                          {product.asin}
                        </code>
                      </td>
                      <td>
                        <strong>{product.productName}</strong>
                        {product.description && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#7f8c8d',
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 6px',
                          backgroundColor: '#e9ecef',
                          borderRadius: '3px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {product.market}
                        </span>
                      </td>
                      <td>
                        {product.price ? (
                          <span style={{ fontWeight: 'bold' }}>
                            {product.currency} {product.price.toFixed(2)}
                          </span>
                        ) : (
                          <span style={{ color: '#7f8c8d' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span style={{ 
                          color: '#27ae60', 
                          fontWeight: 'bold' 
                        }}>
                          {product.commissionRate}%
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: product.status === 'active' ? '#d4edda' : 
                                           product.status === 'inactive' ? '#f8d7da' : '#fff3cd',
                            color: product.status === 'active' ? '#155724' : 
                                   product.status === 'inactive' ? '#721c24' : '#856404'
                          }}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button className="btn btn-primary" style={{ fontSize: '12px', padding: '4px 8px' }}>
                            Edit
                          </button>
                          <button className="btn btn-danger" style={{ fontSize: '12px', padding: '4px 8px' }}>
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Upload History */}
      <div className="card">
        <div className="card-header">
          <h3>📁 Recent Upload History</h3>
        </div>
        <div className="card-content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#d4edda', 
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>
                <strong>Jan 15:</strong> products_jan_2024.csv (245 products)
              </span>
              <span style={{ color: '#155724' }}>✅ Success</span>
            </div>
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#d4edda', 
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>
                <strong>Dec 20:</strong> holiday_products.xlsx (89 products)
              </span>
              <span style={{ color: '#155724' }}>✅ Success</span>
            </div>
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#fff3cd', 
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>
                <strong>Dec 15:</strong> products_dec_2023.csv (312 products)
              </span>
              <span style={{ color: '#856404' }}>⚠️ 12 errors</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsView;