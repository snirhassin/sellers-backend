import React, { useState } from 'react';
import SellersView from './SellersView';
import ProductsView from './ProductsView';
import AnalyticsView from './AnalyticsView';
import UploadView from './UploadView';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface DashboardProps {
  user: User;
  token: string;
  onLogout: () => void;
}

type ViewType = 'sellers' | 'products' | 'analytics' | 'upload';

const Dashboard: React.FC<DashboardProps> = ({ user, token, onLogout }) => {
  const [currentView, setCurrentView] = useState<ViewType>('sellers');
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null);

  const renderView = () => {
    switch (currentView) {
      case 'sellers':
        return (
          <SellersView 
            token={token} 
            onSelectSeller={(sellerId) => {
              setSelectedSeller(sellerId);
              setCurrentView('products');
            }}
          />
        );
      case 'products':
        return (
          <ProductsView 
            token={token} 
            sellerId={selectedSeller}
            onBack={() => setCurrentView('sellers')}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView 
            token={token} 
            sellerId={selectedSeller}
          />
        );
      case 'upload':
        return (
          <UploadView 
            token={token} 
            sellerId={selectedSeller}
          />
        );
      default:
        return <SellersView token={token} onSelectSeller={() => {}} />;
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'sellers':
        return 'Sellers Management';
      case 'products':
        return 'Product Management';
      case 'analytics':
        return 'Analytics Dashboard';
      case 'upload':
        return 'Upload Products';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h2>🏢 Sellers Dashboard</h2>
        <ul className="nav-menu">
          <li>
            <button
              className={currentView === 'sellers' ? 'active' : ''}
              onClick={() => setCurrentView('sellers')}
            >
              👥 Sellers
            </button>
          </li>
          <li>
            <button
              className={currentView === 'products' ? 'active' : ''}
              onClick={() => setCurrentView('products')}
              disabled={!selectedSeller}
            >
              📦 Products
            </button>
          </li>
          <li>
            <button
              className={currentView === 'analytics' ? 'active' : ''}
              onClick={() => setCurrentView('analytics')}
              disabled={!selectedSeller}
            >
              📊 Analytics
            </button>
          </li>
          <li>
            <button
              className={currentView === 'upload' ? 'active' : ''}
              onClick={() => setCurrentView('upload')}
              disabled={!selectedSeller}
            >
              📤 Upload CSV
            </button>
          </li>
        </ul>
        
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #34495e' }}>
          <p style={{ fontSize: '14px', marginBottom: '10px' }}>
            Welcome, {user.firstName || user.email}
          </p>
          <p style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '15px' }}>
            Role: {user.role}
          </p>
        </div>
      </div>

      <div className="main-content">
        <div className="header">
          <h1>{getViewTitle()}</h1>
          <div className="user-info">
            <span>👋 {user.firstName || user.email}</span>
            <button onClick={onLogout} className="logout-btn">
              Sign Out
            </button>
          </div>
        </div>

        {renderView()}
      </div>
    </div>
  );
};

export default Dashboard;