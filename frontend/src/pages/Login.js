import { useState } from 'react';
import api from '../api/api';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ 
    email: '', 
    password: '', 
    tenantSubdomain: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Check if this is super admin login
    const isSuperAdmin = form.email === 'superadmin@system.com';
    
    // Validate
    if (!isSuperAdmin && !form.tenantSubdomain.trim()) {
      setError('Tenant subdomain is required for tenant users');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: form.email,
        password: form.password
      };

      // Only add tenantSubdomain if it's not super admin
      if (!isSuperAdmin && form.tenantSubdomain) {
        payload.tenantSubdomain = form.tenantSubdomain;
      }

      const res = await api.post('/auth/login', payload);
      
      if (res.data.success) {
        localStorage.setItem('token', res.data.data.token);
        // Store user info for easy access
        localStorage.setItem('user', JSON.stringify(res.data.data.user));
        navigate('/dashboard');
      } else {
        setError(res.data.message || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Invalid credentials or server error';
      setError(errorMessage);
      
      // Log error for debugging
      console.error('Login error:', {
        message: errorMessage,
        status: err.response?.status,
        data: err.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '400px', 
      margin: '2rem auto', 
      padding: '2rem', 
      border: '1px solid #ccc',
      borderRadius: '8px',
      backgroundColor: '#fff'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Login</h2>
      
      <form onSubmit={submit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Email</label>
          <input 
            type="email" 
            placeholder="Email" 
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})} 
            required 
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Password</label>
          <input 
            type="password" 
            placeholder="Password" 
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})} 
            required 
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Tenant Subdomain
            <span style={{ fontWeight: 'normal', color: '#666', marginLeft: '5px' }}>
              (leave empty for Super Admin)
            </span>
          </label>
          <input 
            type="text" 
            placeholder="e.g., demo" 
            value={form.tenantSubdomain}
            onChange={e => setForm({...form, tenantSubdomain: e.target.value})}
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            For super admin login: superadmin@system.com (leave subdomain empty)
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '12px', 
            backgroundColor: loading ? '#6c757d' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {error && (
        <div style={{ 
          marginTop: '20px',
          padding: '12px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
        Don't have an account? <Link to="/register" style={{ color: '#2196f3', textDecoration: 'none' }}>Register here</Link>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px', fontSize: '12px', color: '#666' }}>
        <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#495057' }}>Test Credentials:</h4>
        <div style={{ marginBottom: '8px' }}>
          <strong>Super Admin:</strong> superadmin@system.com / Admin@123<br />
          <small>(leave subdomain empty)</small>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong>Tenant Admin:</strong> admin@demo.com / Demo@123<br />
          <small>(subdomain: demo)</small>
        </div>
        <div>
          <strong>Regular User:</strong> user1@demo.com / User@123<br />
          <small>(subdomain: demo)</small>
        </div>
      </div>
    </div>
  );
}