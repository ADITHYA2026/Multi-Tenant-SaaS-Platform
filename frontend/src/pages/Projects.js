import { useEffect, useState, useContext } from 'react';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'active'
  });
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // Filter projects based on search term and status
    let filtered = projects;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }
    
    setFilteredProjects(filtered);
  }, [projects, searchTerm, statusFilter]);

  const fetchProjects = () => {
    setLoading(true);
    api.get('/projects')
      .then(res => {
        const projectsData = res.data.data?.projects || res.data.data || [];
        setProjects(projectsData);
        setFilteredProjects(projectsData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects');
        setLoading(false);
      });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', newProject);
      setNewProject({
        name: '',
        description: '',
        status: 'active'
      });
      setShowCreateModal(false);
      fetchProjects(); // Refresh projects list
    } catch (err) {
      console.error('Error creating project:', err);
      alert(err.response?.data?.message || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? All tasks will also be deleted.')) {
      try {
        await api.delete(`/projects/${projectId}`);
        fetchProjects(); // Refresh projects list
      } catch (err) {
        console.error('Error deleting project:', err);
        alert(err.response?.data?.message || 'Failed to delete project');
      }
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ padding: '20px' }}>
          <p>Loading projects...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Projects</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            + Create Project
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
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Search Projects</label>
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            
            <div style={{ width: '150px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
        </div>

        {/* Create Project Modal */}
        {showCreateModal && (
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
                <h3 style={{ margin: 0 }}>Create New Project</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
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
              
              <form onSubmit={handleCreateProject}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Project Name *</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={e => setNewProject({...newProject, name: e.target.value})}
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={e => setNewProject({...newProject, description: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '100px' }}
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status</label>
                  <select
                    value={newProject.status}
                    onChange={e => setNewProject({...newProject, status: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
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
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '20px'
          }}>
            {filteredProjects.map(project => (
              <div key={project.id} style={{ 
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderTop: `4px solid ${
                  project.status === 'completed' ? '#4caf50' : 
                  project.status === 'archived' ? '#9e9e9e' : '#2196f3'
                }`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
                      <Link 
                        to={`/projects/${project.id}`}
                        style={{ 
                          color: '#2196f3', 
                          textDecoration: 'none',
                          ':hover': { textDecoration: 'underline' }
                        }}
                      >
                        {project.name}
                      </Link>
                    </h3>
                    
                    <div style={{ 
                      display: 'inline-block',
                      padding: '4px 12px',
                      backgroundColor: project.status === 'active' ? '#e8f5e9' : 
                                       project.status === 'completed' ? '#f1f8e9' : '#f5f5f5',
                      color: project.status === 'active' ? '#388e3c' : 
                             project.status === 'completed' ? '#689f38' : '#757575',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginBottom: '10px'
                    }}>
                      {project.status.toUpperCase()}
                    </div>
                    
                    {project.description && (
                      <p style={{ 
                        color: '#666', 
                        fontSize: '14px', 
                        margin: '0 0 15px 0',
                        lineHeight: '1.4'
                      }}>
                        {project.description.length > 150 ? 
                          `${project.description.substring(0, 150)}...` : 
                          project.description
                        }
                      </p>
                    )}
                    
                    <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#666' }}>
                      <div>
                        <strong>Tasks:</strong> {project.task_count || 0}
                      </div>
                      <div>
                        <strong>Completed:</strong> {project.completed_task_count || 0}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                      Created: {new Date(project.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '15px',
                  borderTop: '1px solid #eee',
                  paddingTop: '15px'
                }}>
                  <Link 
                    to={`/projects/${project.id}`}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#2196f3',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    View Details
                  </Link>
                  
                  {(user?.role === 'tenant_admin' || user?.role === 'super_admin' || project.created_by === user?.id) && (
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Delete
                    </button>
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
            {projects.length === 0 ? (
              <>
                <p style={{ fontSize: '18px', marginBottom: '10px' }}>No projects yet</p>
                <p>Click "Create Project" to create your first project</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: '18px', marginBottom: '10px' }}>No projects match your filters</p>
                <p>Try changing your search or filter criteria</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
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
      </div>
    </>
  );
}