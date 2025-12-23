import { useState } from 'react';
import api from '../api/api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();
    try {
      await api.post('/auth/register-tenant', {
        tenantName: form.org,
        subdomain: form.subdomain,
        adminEmail: form.email,
        adminPassword: form.password,
        adminFullName: form.name
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  return (
    <form onSubmit={submit}>
      <h2>Register Tenant</h2>
      <input placeholder="Organization Name" onChange={e => setForm({...form, org:e.target.value})} required />
      <input placeholder="Subdomain" onChange={e => setForm({...form, subdomain:e.target.value})} required />
      <input placeholder="Admin Email" onChange={e => setForm({...form, email:e.target.value})} required />
      <input placeholder="Admin Full Name" onChange={e => setForm({...form, name:e.target.value})} required />
      <input type="password" placeholder="Password" onChange={e => setForm({...form, password:e.target.value})} required />
      <button>Create Tenant</button>
      {error && <p>{error}</p>}
      <Link to="/login">Login</Link>
    </form>
  );
}