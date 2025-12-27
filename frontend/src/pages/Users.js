import { useEffect, useState, useContext } from 'react';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { AuthContext } from '../auth/AuthContext';

export default function Users() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'user'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    if (user && user.tenant_id) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = () => {
    setLoading(true);
    api.get(`/tenants/${user.tenant_id}/users`)
      .then(res => {
        const usersData = res.data.data?.users || res.data.data || [];
        setUsers(usersData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
        setLoading(false);
      });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/tenants/${user.tenant_id}/users`, newUser);
      setNewUser({
        email: '',
        password: '',
        fullName: '',
        role: 'user'
      });
      setShowAddModal(false);
      fetchUsers(); // Refresh users list
    } catch (err) {
      console.error('Error adding user:', err);
      alert(err.response?.data?.message || 'Failed to add user');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      try {
        await api.delete(`/users/${userId}`);
        fetchUsers(); // Refresh users list
      } catch (err) {
        console.error('Error deleting user:', err);
        alert(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleUpdateUserStatus = async (userId, isActive) => {
    try {
      await api.put(`/users/${userId}`, { isActive });
      fetchUsers(); // Refresh users list
    } catch (err) {
      console.error('Error updating user status:', err);
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = searchTerm === '' || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ padding: '20px' }}>
          <p>Loading users...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Users Management</h2>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            + Add User
          </button>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            padding: '10px', 
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* Filters */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Search Users</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            
            <div style={{ width: '150px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Role</label>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="tenant_admin">Admin</option>
              </select>
            </div>
          </div>
          
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Add New User</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleAddUser}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name *</label>
                  <input
                    type="text"
                    value={newUser.fullName}
                    onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password * (min 8 chars)</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                    required
                    minLength="8"
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Role</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="user">Regular User</option>
                    <option value="tenant_admin">Tenant Admin</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users Table */}
        {filteredUsers.length > 0 ? (
          <div style={{ 
            backgroundColor: '#fff',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr',
              backgroundColor: '#f8f9fa',
              padding: '15px 20px',
              borderBottom: '1px solid #e0e0e0',
              fontWeight: 'bold',
              fontSize: '14px',
              color: '#495057'
            }}>
              <div>Name</div>
              <div>Email</div>
              <div>Role</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            
            {filteredUsers.map(u => (
              <div 
                key={u.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr',
                  padding: '15px 20px',
                  borderBottom: '1px solid #e0e0e0',
                  alignItems: 'center',
                  fontSize: '14px',
                  backgroundColor: u.id === user?.id ? '#f0f8ff' : 'transparent'
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#333' }}>
                  {u.full_name}
                  {u.id === user?.id && (
                    <span style={{ 
                      marginLeft: '8px',
                      padding: '2px 6px',
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 'normal'
                    }}>
                      You
                    </span>
                  )}
                </div>
                
                <div style={{ color: '#666' }}>{u.email}</div>
                
                <div>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: u.role === 'tenant_admin' ? '#e8f5e9' : '#e3f2fd',
                    color: u.role === 'tenant_admin' ? '#388e3c' : '#1976d2',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {u.role.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: u.is_active ? '#e8f5e9' : '#ffebee',
                    color: u.is_active ? '#388e3c' : '#d32f2f',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  {u.id !== user?.id && (
                    <>
                      <button
                        onClick={() => handleUpdateUserStatus(u.id, !u.is_active)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: u.is_active ? '#ff9800' : '#4caf50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteUser(u.id, u.full_name)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            color: '#666'
          }}>
            {users.length === 0 ? (
              <>
                <p style={{ fontSize: '18px', marginBottom: '10px' }}>No users yet</p>
                <p>Click "Add User" to add users to your tenant</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: '18px', marginBottom: '10px' }}>No users match your filters</p>
                <p>Try changing your search or filter criteria</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('all');
                  }}
                  style={{
                    marginTop: '15px',
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        )}
        
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
          Note: You cannot delete or deactivate your own account. Regular users cannot be promoted to admin.
        </div>
      </div>
    </>
  );
}