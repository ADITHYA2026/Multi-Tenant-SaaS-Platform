import { useState } from 'react';
import api from '../api/api';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async e => {
  e.preventDefault();
  setError('');

  const isSuperAdmin = form.email === 'superadmin@system.com';

  if (!isSuperAdmin && !form.tenantSubdomain) {
    setError('Tenant subdomain is required for tenant users');
    return;
  }

  const payload = {
    email: form.email,
    password: form.password,
  };

  if (form.tenantSubdomain) {
    payload.tenantSubdomain = form.tenantSubdomain;
  }

  try {
    const res = await api.post('/auth/login', payload);
    localStorage.setItem('token', res.data.data.token);
    navigate('/dashboard');
  } catch {
    setError('Invalid credentials');
  }
};

  return (
    <form onSubmit={submit}>
      <h2>Login</h2>
      <input placeholder="Email" onChange={e => setForm({...form,email:e.target.value})} required />
      <input type="password" placeholder="Password" onChange={e => setForm({...form,password:e.target.value})} required />
      <input placeholder="Tenant Subdomain (leave empty for Super Admin)"
      onChange={e => setForm({...form, tenantSubdomain: e.target.value})}
/>

      <button>Login</button>
      {error && <p>{error}</p>}
      <Link to="/register">Register</Link>
    </form>
  );
}