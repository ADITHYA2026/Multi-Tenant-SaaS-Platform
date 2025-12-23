import { useEffect, useState, useContext } from 'react';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { AuthContext } from '../auth/AuthContext';

export default function Users() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get(`/tenants/${user.tenant_id}/users`).then(res => setUsers(res.data.data));
  }, [user]);

  return (
    <>
      <Navbar />
      <h2>Users</h2>
      {users.map(u => (
        <div key={u.id}>
          {u.full_name} ({u.role})
          <button onClick={() => api.delete(`/users/${u.id}`).then(()=>window.location.reload())}>Delete</button>
        </div>
      ))}
    </>
  );
}