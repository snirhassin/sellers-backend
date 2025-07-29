import React, { useState, useEffect } from 'react';

interface Seller {
  id: string;
  companyName: string;
  contactEmail: string;
  contactPhone?: string;
  contactPerson?: string;
  defaultCommissionRate: number;
  status: string;
  createdAt: string;
  _count?: {
    products: number;
    uploadBatches: number;
  };
}

interface SellersViewProps {
  token: string;
  onSelectSeller: (sellerId: string) => void;
}

const SellersView: React.FC<SellersViewProps> = ({ token, onSelectSeller }) => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/sellers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSellers(data.sellers || []);
      } else {
        setError('Failed to fetch sellers');
      }
    } catch (err) {
      setError('Network error. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = seller.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seller.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || seller.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{sellers.length}</div>
          <div className="stat-label">Total Sellers</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{sellers.filter(s => s.status === 'active').length}</div>
          <div className="stat-label">Active Sellers</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {sellers.reduce((sum, s) => sum + (s._count?.products || 0), 0)}
          </div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {sellers.length > 0 ? (sellers.reduce((sum, s) => sum + s.defaultCommissionRate, 0) / sellers.length).toFixed(1) : 0}%
          </div>
          <div className="stat-label">Avg Commission</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-header">
          <h3>Search & Filter</h3>
        </div>
        <div className="card-content">
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="Search sellers by company name or email..."
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
                <option value="pending">Pending</option>
              </select>
            </div>
            <button onClick={fetchSellers} className="btn btn-primary">
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Sellers Table */}
      <div className="card">
        <div className="card-header">
          <h3>Sellers ({filteredSellers.length})</h3>
        </div>
        <div className="card-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {filteredSellers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
              {sellers.length === 0 ? (
                <>
                  <p>No sellers found.</p>
                  <p>The backend database might not be set up yet.</p>
                  <p style={{ fontSize: '14px', marginTop: '10px' }}>
                    Run: <code>npm run db:push && npm run db:seed</code> in the backend folder
                  </p>
                </>
              ) : (
                <p>No sellers match your search criteria.</p>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Contact</th>
                    <th>Phone</th>
                    <th>Products</th>
                    <th>Commission</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSellers.map((seller) => (
                    <tr key={seller.id}>
                      <td>
                        <strong>{seller.companyName}</strong>
                        {seller.contactPerson && (
                          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                            {seller.contactPerson}
                          </div>
                        )}
                      </td>
                      <td>{seller.contactEmail}</td>
                      <td>{seller.contactPhone || '-'}</td>
                      <td>
                        <span style={{ fontWeight: 'bold' }}>
                          {seller._count?.products || 0}
                        </span>
                        {seller._count?.uploadBatches && (
                          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                            {seller._count.uploadBatches} uploads
                          </div>
                        )}
                      </td>
                      <td>{seller.defaultCommissionRate}%</td>
                      <td>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: seller.status === 'active' ? '#d4edda' : 
                                           seller.status === 'inactive' ? '#f8d7da' : '#fff3cd',
                            color: seller.status === 'active' ? '#155724' : 
                                   seller.status === 'inactive' ? '#721c24' : '#856404'
                          }}
                        >
                          {seller.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => onSelectSeller(seller.id)}
                          className="btn btn-primary"
                          style={{ fontSize: '12px' }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellersView;