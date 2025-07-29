import React, { useState, useEffect } from 'react';

interface AnalyticsData {
  summary: {
    totalRevenue: string;
    totalCommission: string;
    totalUnits: number;
    uniqueProducts: number;
    avgOrderValue: string;
  };
  topProducts: Array<{
    asin: string;
    productName: string;
    market: string;
    revenue: string;
    units: number;
    salesCount: number;
  }>;
  recentActivity: Array<{
    id: string;
    productName: string;
    asin: string;
    quantity: number;
    revenue: string;
    commission: string;
    saleDate: string;
  }>;
}

interface AnalyticsViewProps {
  token: string;
  sellerId: string | null;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ token, sellerId }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    if (sellerId) {
      fetchAnalytics();
    }
  }, [sellerId, period]);

  const fetchAnalytics = async () => {
    if (!sellerId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/analytics/seller/${sellerId}/dashboard?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        setError('Failed to fetch analytics');
      }
    } catch (err) {
      setError('Network error. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const mockChartData = () => {
    const days = [];
    const revenues = [];
    const commissions = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Mock data with some variation
      const baseRevenue = 1000 + Math.random() * 2000;
      revenues.push(baseRevenue);
      commissions.push(baseRevenue * 0.08); // 8% commission
    }
    
    return { days, revenues, commissions };
  };

  if (!sellerId) {
    return (
      <div className="card">
        <div className="card-content">
          <p>Please select a seller first to view analytics.</p>
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

  const chartData = mockChartData();

  // Mock data for demonstration
  const mockAnalytics = analytics || {
    summary: {
      totalRevenue: "45230.00",
      totalCommission: "3247.50",
      totalUnits: 2847,
      uniqueProducts: 156,
      avgOrderValue: "15.89"
    },
    topProducts: [
      { asin: "B08N5WRWNW", productName: "Wireless Earbuds", market: "US", revenue: "7017.00", units: 234, salesCount: 89 },
      { asin: "B09KXJM2P3", productName: "Bluetooth Speaker", market: "DE", revenue: "7098.00", units: 156, salesCount: 67 },
      { asin: "B07XJ8C8F7", productName: "Phone Charger", market: "UK", revenue: "3021.00", units: 189, salesCount: 134 },
      { asin: "B08HLQD2J6", productName: "USB Cable", market: "US", revenue: "3867.00", units: 298, salesCount: 156 },
      { asin: "B09XYZ1234", productName: "Power Bank", market: "CA", revenue: "4020.00", units: 134, salesCount: 78 }
    ],
    recentActivity: [
      { id: "1", productName: "Wireless Earbuds", asin: "B08N5WRWNW", quantity: 15, revenue: "449.85", commission: "38.24", saleDate: "2 hours ago" },
      { id: "2", productName: "Phone Charger", asin: "B07XJ8C8F7", quantity: 8, revenue: "127.92", commission: "8.95", saleDate: "1 day ago" },
      { id: "3", productName: "Bluetooth Speaker", asin: "B09KXJM2P3", quantity: 3, revenue: "136.50", commission: "12.56", saleDate: "2 days ago" },
      { id: "4", productName: "USB Cable", asin: "B08HLQD2J6", quantity: 25, revenue: "324.75", commission: "21.11", saleDate: "3 days ago" }
    ]
  };

  return (
    <div>
      {/* Time Period Selector */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <label>Time Period:</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="365">Last Year</option>
        </select>
        <button onClick={fetchAnalytics} className="btn btn-primary">
          🔄 Refresh
        </button>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-secondary">📊 Export PDF</button>
          <button className="btn btn-success" style={{ marginLeft: '10px' }}>📈 Export Excel</button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">${mockAnalytics.summary.totalRevenue}</div>
          <div className="stat-label">Total Revenue</div>
          <div style={{ fontSize: '12px', color: '#27ae60', marginTop: '5px' }}>
            +12.4% ↗
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{mockAnalytics.summary.totalUnits.toLocaleString()}</div>
          <div className="stat-label">Units Sold</div>
          <div style={{ fontSize: '12px', color: '#27ae60', marginTop: '5px' }}>
            +8.2% ↗
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-number">${mockAnalytics.summary.totalCommission}</div>
          <div className="stat-label">Commission Earned</div>
          <div style={{ fontSize: '12px', color: '#27ae60', marginTop: '5px' }}>
            +15.1% ↗
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-number">${mockAnalytics.summary.avgOrderValue}</div>
          <div className="stat-label">Avg Order Value</div>
          <div style={{ fontSize: '12px', color: '#e74c3c', marginTop: '5px' }}>
            -2.1% ↘
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Revenue Trend Chart */}
        <div className="card">
          <div className="card-header">
            <h3>📈 Revenue Trend (Last 30 Days)</h3>
          </div>
          <div className="card-content">
            <div style={{ 
              height: '300px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '4px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Simple ASCII-style chart representation */}
              <div style={{ width: '100%', height: '100%', position: 'relative', padding: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'end', 
                  justifyContent: 'space-between', 
                  height: '200px',
                  borderBottom: '2px solid #dee2e6',
                  borderLeft: '2px solid #dee2e6'
                }}>
                  {chartData.revenues.slice(0, 15).map((revenue, index) => (
                    <div key={index} style={{
                      width: '12px',
                      height: `${(revenue / Math.max(...chartData.revenues)) * 180}px`,
                      backgroundColor: index % 2 === 0 ? '#3498db' : '#2980b9',
                      marginRight: '2px',
                      borderRadius: '2px 2px 0 0'
                    }}></div>
                  ))}
                </div>
                <div style={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  padding: '10px',
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
                    Revenue Growth
                  </div>
                  <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                    Interactive chart would go here
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Commission Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3>💰 Commission Breakdown</h3>
          </div>
          <div className="card-content">
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>This Month:</span>
                <strong>${mockAnalytics.summary.totalCommission}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Last Month:</span>
                <span>$2,890.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#27ae60' }}>
                <span>Growth:</span>
                <strong>+12.4% ↗</strong>
              </div>
            </div>

            <div>
              <h4 style={{ marginBottom: '15px' }}>Commission Rate Distribution</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { range: '6-7%', percentage: 34, color: '#3498db' },
                  { range: '7-8%', percentage: 28, color: '#2980b9' },
                  { range: '8-9%', percentage: 19, color: '#1abc9c' },
                  { range: '9%+', percentage: 19, color: '#27ae60' }
                ].map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ minWidth: '40px', fontSize: '14px' }}>{item.range}:</span>
                    <div style={{ 
                      flex: 1, 
                      height: '20px', 
                      backgroundColor: '#e9ecef', 
                      borderRadius: '10px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${item.percentage}%`,
                        height: '100%',
                        backgroundColor: item.color,
                        borderRadius: '10px'
                      }}></div>
                    </div>
                    <span style={{ minWidth: '30px', fontSize: '14px', textAlign: 'right' }}>
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Products */}
      <div className="card">
        <div className="card-header">
          <h3>🏆 Top Performing Products</h3>
        </div>
        <div className="card-content">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>ASIN</th>
                  <th>Market</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                  <th>Sales Count</th>
                </tr>
              </thead>
              <tbody>
                {mockAnalytics.topProducts.map((product, index) => (
                  <tr key={product.asin}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: index < 3 ? '#f39c12' : '#bdc3c7',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {index + 1}
                        </span>
                        <strong>{product.productName}</strong>
                      </div>
                    </td>
                    <td>
                      <code style={{ backgroundColor: '#f8f9fa', padding: '2px 4px', borderRadius: '3px' }}>
                        {product.asin}
                      </code>
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
                    <td style={{ fontWeight: 'bold' }}>{product.units.toLocaleString()}</td>
                    <td style={{ fontWeight: 'bold', color: '#27ae60' }}>${product.revenue}</td>
                    <td>{product.salesCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Market Performance & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Market Performance */}
        <div className="card">
          <div className="card-header">
            <h3>🌍 Market Performance</h3>
          </div>
          <div className="card-content">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Market</th>
                    <th>Products</th>
                    <th>Revenue</th>
                    <th>Avg Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { market: 'US', products: 589, revenue: '18234', avgCommission: '7.8' },
                    { market: 'UK', products: 398, revenue: '12890', avgCommission: '7.2' },
                    { market: 'DE', products: 234, revenue: '9456', avgCommission: '8.1' },
                    { market: 'CA', products: 156, revenue: '4650', avgCommission: '7.5' }
                  ].map((market) => (
                    <tr key={market.market}>
                      <td style={{ fontWeight: 'bold' }}>{market.market}</td>
                      <td>{market.products}</td>
                      <td>${market.revenue}</td>
                      <td>{market.avgCommission}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3>🕒 Recent Activity</h3>
          </div>
          <div className="card-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mockAnalytics.recentActivity.map((activity) => (
                <div key={activity.id} style={{
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {activity.quantity} units sold
                      </div>
                      <div style={{ fontSize: '14px', color: '#2c3e50', marginBottom: '4px' }}>
                        {activity.productName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                        ASIN: {activity.asin}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: '#27ae60' }}>
                        ${activity.revenue}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                        Commission: ${activity.commission}
                      </div>
                      <div style={{ fontSize: '12px', color: '#95a5a6' }}>
                        {activity.saleDate}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;