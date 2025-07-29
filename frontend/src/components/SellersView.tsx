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
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [newSeller, setNewSeller] = useState({
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    contactPerson: '',
    defaultCommissionRate: 7.5,
    status: 'active'
  });

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sellers', {
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

  const handleAddSeller = async () => {
    try {
      const response = await fetch('/api/sellers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSeller),
      });

      if (response.ok) {
        const result = await response.json();
        setSellers([...sellers, result.seller]);
        setShowAddModal(false);
        setNewSeller({
          companyName: '',
          contactEmail: '',
          contactPhone: '',
          contactPerson: '',
          defaultCommissionRate: 7.5,
          status: 'active'
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add seller');
      }
    } catch (err) {
      setError('Network error while adding seller');
    }
  };

  const handleEditSeller = async () => {
    if (!editingSeller) return;
    
    try {
      const response = await fetch(`/api/sellers/${editingSeller.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSeller),
      });

      if (response.ok) {
        const result = await response.json();
        setSellers(sellers.map(s => s.id === editingSeller.id ? result.seller : s));
        setEditingSeller(null);
        setNewSeller({
          companyName: '',
          contactEmail: '',
          contactPhone: '',
          contactPerson: '',
          defaultCommissionRate: 7.5,
          status: 'active'
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update seller');
      }
    } catch (err) {
      setError('Network error while updating seller');
    }
  };

  const handleDeleteSeller = async (sellerId: string) => {
    if (!confirm('Are you sure you want to delete this seller? This will also delete all their products.')) {
      return;
    }

    try {
      const response = await fetch(`/api/sellers/${sellerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSellers(sellers.filter(s => s.id !== sellerId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete seller');
      }
    } catch (err) {
      setError('Network error while deleting seller');
    }
  };

  const openEditModal = (seller: Seller) => {
    setEditingSeller(seller);
    setNewSeller({
      companyName: seller.companyName,
      contactEmail: seller.contactEmail,
      contactPhone: seller.contactPhone || '',
      contactPerson: seller.contactPerson || '',
      defaultCommissionRate: seller.defaultCommissionRate,
      status: seller.status
    });
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
            <button onClick={() => setShowAddModal(true)} className="btn btn-success">
              ➕ Add Seller
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
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            onClick={() => onSelectSeller(seller.id)}
                            className="btn btn-primary"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEditModal(seller)}
                            className="btn btn-secondary"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSeller(seller.id)}
                            className="btn btn-danger"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
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

      {/* Add/Edit Seller Modal */}
      {(showAddModal || editingSeller) && (
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
            width: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3>{editingSeller ? 'Edit Seller' : 'Add New Seller'}</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Company Name *
              </label>
              <input
                type="text"
                value={newSeller.companyName}
                onChange={(e) => setNewSeller({...newSeller, companyName: e.target.value})}
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
                Contact Email *
              </label>
              <input
                type="email"
                value={newSeller.contactEmail}
                onChange={(e) => setNewSeller({...newSeller, contactEmail: e.target.value})}
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
                Contact Person
              </label>
              <input
                type="text"
                value={newSeller.contactPerson}
                onChange={(e) => setNewSeller({...newSeller, contactPerson: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Contact Phone
              </label>
              <input
                type="tel"
                value={newSeller.contactPhone}
                onChange={(e) => setNewSeller({...newSeller, contactPhone: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Default Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={newSeller.defaultCommissionRate}
                onChange={(e) => setNewSeller({...newSeller, defaultCommissionRate: parseFloat(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Status
              </label>
              <select
                value={newSeller.status}
                onChange={(e) => setNewSeller({...newSeller, status: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingSeller(null);
                  setNewSeller({
                    companyName: '',
                    contactEmail: '',
                    contactPhone: '',
                    contactPerson: '',
                    defaultCommissionRate: 7.5,
                    status: 'active'
                  });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={editingSeller ? handleEditSeller : handleAddSeller}
                className="btn btn-primary"
                disabled={!newSeller.companyName || !newSeller.contactEmail}
              >
                {editingSeller ? 'Update' : 'Add'} Seller
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellersView;