import { useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { user } = useContext(AuthContext);

  return (
    <nav>
      <h3>SaaS App</h3>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/projects">Projects</Link>
      {user?.role === 'tenant_admin' && <Link to="/users">Users</Link>}
      <span>{user?.full_name} ({user?.role})</span>
      <button onClick={() => {localStorage.clear(); window.location='/login'}}>Logout</button>
    </nav>
  );
}