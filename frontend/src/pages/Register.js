import { useState } from 'react';
import api from '../api/api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({
    org: '',
    subdomain: '',
    email: '',
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    // Validate subdomain (alphanumeric and hyphens only)
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!subdomainRegex.test(form.subdomain)) {
      setError('Subdomain can only contain lowercase letters, numbers, and hyphens (not at start/end)');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/register-tenant', {
        tenantName: form.org,
        subdomain: form.subdomain,
        adminEmail: form.email,
        adminPassword: form.password,
        adminFullName: form.name
      });
      
      if (res.data.success) {
        alert('Tenant registered successfully! You can now login.');
        navigate('/login');
      } else {
        setError(res.data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '2rem auto', 
      padding: '2rem', 
      border: '1px solid #ccc',
      borderRadius: '8px',
      backgroundColor: '#fff'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Register New Tenant</h2>
      
      <form onSubmit={submit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Organization Name *</label>
          <input 
            placeholder="Your Company Name"
            value={form.org}
            onChange={e => setForm({...form, org: e.target.value})}
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
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Subdomain *</label>
          <input 
            placeholder="company-name"
            value={form.subdomain}
            onChange={e => setForm({...form, subdomain: e.target.value.toLowerCase()})}
            required 
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            Your login URL will be: {form.subdomain ? `${form.subdomain}.yourapp.com` : 'subdomain.yourapp.com'}
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Admin Full Name *</label>
          <input 
            placeholder="John Doe"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
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
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Admin Email *</label>
          <input 
            type="email"
            placeholder="admin@company.com"
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
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Password *</label>
          <input 
            type="password"
            placeholder="Minimum 8 characters"
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            required 
            minLength="8"
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Confirm Password *</label>
          <input 
            type="password"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChange={e => setForm({...form, confirmPassword: e.target.value})}
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

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '12px', 
            backgroundColor: loading ? '#6c757d' : '#4caf50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Creating Tenant...' : 'Create Tenant'}
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
        Already have an account? <Link to="/login" style={{ color: '#2196f3', textDecoration: 'none' }}>Login here</Link>
      </div>
    </div>
  );
}