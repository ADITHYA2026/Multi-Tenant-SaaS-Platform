import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';
import api from '../api/api';

export default function Navbar() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore errors for logout
    }
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      padding: '1rem', 
      backgroundColor: '#f0f0f0' 
    }}>
      <div>
        <Link to="/dashboard" style={{ marginRight: '1rem' }}>Dashboard</Link>
        <Link to="/projects" style={{ marginRight: '1rem' }}>Projects</Link>
        {user && (user.role === 'tenant_admin' || user.role === 'super_admin') && (
          <Link to="/users" style={{ marginRight: '1rem' }}>Users</Link>
        )}
        {user && user.role === 'super_admin' && (
          <Link to="/tenants" style={{ marginRight: '1rem' }}>Tenants</Link>
        )}
      </div>
      <div>
        {user && (
          <>
            <span style={{ marginRight: '1rem' }}>
              {user.full_name} ({user.role})
            </span>
            <button onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}