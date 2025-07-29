import React, { useState } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface LoginProps {
  onLogin: (user: User, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('snir.hassin@gmail.com');
  const [password, setPassword] = useState('moty22');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.user, data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Make sure the backend server is running on port 3000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>🏢 Sellers Dashboard</h2>
        <p style={{ textAlign: 'center', marginBottom: '20px', color: '#7f8c8d' }}>
          Sign in to manage sellers and analytics
        </p>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        {error && <div className="error-message">{error}</div>}

        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', fontSize: '14px' }}>
          <strong>Available Credentials:</strong><br />
          Custom Admin: snir.hassin@gmail.com / moty22<br />
          Demo Admin: admin@company.com / password123<br />
          Demo Operator: operator@company.com / password123
        </div>
      </form>
    </div>
  );
};

export default Login;