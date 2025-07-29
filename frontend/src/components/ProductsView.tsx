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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    asin: '',
    market: 'US',
    productName: '',
    description: '',
    price: 0,
    currency: 'USD',
    commissionRate: 7.5,
    status: 'active'
  });

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

  const handleAddProduct = async () => {
    if (!sellerId) return;

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newProduct,
          sellerId
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setProducts([...products, result.product]);
        setShowAddModal(false);
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add product');
      }
    } catch (err) {
      setError('Network error while adding product');
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        const result = await response.json();
        setProducts(products.map(p => p.id === editingProduct.id ? result.product : p));
        setEditingProduct(null);
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update product');
      }
    } catch (err) {
      setError('Network error while updating product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete product');
      }
    } catch (err) {
      setError('Network error while deleting product');
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      asin: product.asin,
      market: product.market,
      productName: product.productName,
      description: product.description || '',
      price: product.price || 0,
      currency: product.currency,
      commissionRate: product.commissionRate,
      status: product.status
    });
  };

  const resetForm = () => {
    setNewProduct({
      asin: '',
      market: 'US',
      productName: '',
      description: '',
      price: 0,
      currency: 'USD',
      commissionRate: 7.5,
      status: 'active'
    });
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
            <button 
              className="btn btn-success"
              onClick={() => {/* TODO: Switch to upload view */}}
            >
              📁 Upload CSV
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
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
                          <button 
                            className="btn btn-primary" 
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            onClick={() => openEditModal(product)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            onClick={() => handleDeleteProduct(product.id)}
                          >
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

      {/* Add/Edit Product Modal */}
      {(showAddModal || editingProduct) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '600px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  ASIN *
                </label>
                <input
                  type="text"
                  value={newProduct.asin}
                  onChange={(e) => setNewProduct({...newProduct, asin: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Market *
                </label>
                <select
                  value={newProduct.market}
                  onChange={(e) => setNewProduct({...newProduct, market: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <option value="US">US</option>
                  <option value="UK">UK</option>
                  <option value="DE">DE</option>
                  <option value="FR">FR</option>
                  <option value="IT">IT</option>
                  <option value="ES">ES</option>
                  <option value="CA">CA</option>
                  <option value="JP">JP</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Product Name *
              </label>
              <input
                type="text"
                value={newProduct.productName}
                onChange={(e) => setNewProduct({...newProduct, productName: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Description
              </label>
              <textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '80px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Currency
                </label>
                <select
                  value={newProduct.currency}
                  onChange={(e) => setNewProduct({...newProduct, currency: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Commission Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={newProduct.commissionRate}
                  onChange={(e) => setNewProduct({...newProduct, commissionRate: parseFloat(e.target.value) || 0})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Status
                </label>
                <select
                  value={newProduct.status}
                  onChange={(e) => setNewProduct({...newProduct, status: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={editingProduct ? handleEditProduct : handleAddProduct}
                className="btn btn-primary"
                disabled={!newProduct.asin || !newProduct.productName}
              >
                {editingProduct ? 'Update' : 'Add'} Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsView;