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
        navigate('/dashboard');
      } else {
        setError(res.data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials or server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc' }}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Email</label>
          <input 
            type="email" 
            placeholder="Email" 
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})} 
            required 
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label>Password</label>
          <input 
            type="password" 
            placeholder="Password" 
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})} 
            required 
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label>Tenant Subdomain (leave empty for Super Admin)</label>
          <input 
            type="text" 
            placeholder="e.g., demo" 
            value={form.tenantSubdomain}
            onChange={e => setForm({...form, tenantSubdomain: e.target.value})}
            style={{ width: '100%', padding: '0.5rem' }}
          />
          <small>For super admin (superadmin@system.com), leave this empty</small>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '0.75rem', backgroundColor: '#007bff', color: 'white', border: 'none' }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#f8d7da', color: '#721c24' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <Link to="/register">Don't have an account? Register</Link>
      </div>

      <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
        <h4>Test Credentials:</h4>
        <p><strong>Super Admin:</strong> superadmin@system.com / Admin@123</p>
        <p><strong>Tenant Admin:</strong> admin@demo.com / Admin@123 (subdomain: demo)</p>
        <p><strong>Regular User:</strong> user1@demo.com / Admin@123 (subdomain: demo)</p>
      </div>
    </div>
  );
}