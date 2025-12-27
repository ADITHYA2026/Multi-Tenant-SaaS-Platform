import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { AuthContext } from '../auth/AuthContext';

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: '',
    dueDate: ''
  });
  const [showCreateTask, setShowCreateTask] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchProjectDetails();
    fetchTasks();
  }, [projectId]);

  const fetchProjectDetails = () => {
    api.get(`/projects/${projectId}`)
      .then(res => {
        setProject(res.data.data);
      })
      .catch(err => {
        console.error('Error fetching project:', err);
        setError('Failed to load project details');
      });
  };

  const fetchTasks = () => {
    setLoading(true);
    api.get(`/projects/${projectId}/tasks`)
      .then(res => {
        const tasksData = res.data.data?.tasks || res.data.data || [];
        setTasks(tasksData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks');
        setLoading(false);
      });
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${projectId}/tasks`, newTask);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        assignedTo: '',
        dueDate: ''
      });
      setShowCreateTask(false);
      fetchTasks(); // Refresh tasks
    } catch (err) {
      console.error('Error creating task:', err);
      alert(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleDeleteProject = () => {
    if (window.confirm('Are you sure you want to delete this project? All tasks will also be deleted.')) {
      api.delete(`/projects/${projectId}`)
        .then(() => {
          alert('Project deleted successfully');
          navigate('/projects');
        })
        .catch(err => {
          console.error('Error deleting project:', err);
          alert(err.response?.data?.message || 'Failed to delete project');
        });
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      fetchTasks(); // Refresh tasks
    } catch (err) {
      console.error('Error updating task status:', err);
      alert(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${taskId}`);
        fetchTasks(); // Refresh tasks
      } catch (err) {
        console.error('Error deleting task:', err);
        alert(err.response?.data?.message || 'Failed to delete task');
      }
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ padding: '20px' }}>
          <p>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ padding: '20px' }}>
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

        {/* Project Header */}
        {project && (
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>{project.name}</h2>
              <div>
                {(user?.role === 'tenant_admin' || user?.role === 'super_admin' || project.created_by === user?.id) && (
                  <>
                    <button
                      onClick={() => navigate(`/projects/${projectId}/edit`)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#ff9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        marginRight: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit Project
                    </button>
                    <button
                      onClick={handleDeleteProject}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete Project
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div style={{ 
              display: 'inline-block',
              padding: '4px 12px',
              backgroundColor: project.status === 'active' ? '#e8f5e9' : 
                               project.status === 'completed' ? '#f1f8e9' : '#f5f5f5',
              color: project.status === 'active' ? '#388e3c' : 
                     project.status === 'completed' ? '#689f38' : '#757575',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '15px'
            }}>
              {project.status.toUpperCase()}
            </div>

            {project.description && (
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '6px',
                marginBottom: '20px'
              }}>
                <h4 style={{ marginTop: 0 }}>Description</h4>
                <p style={{ margin: 0 }}>{project.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Tasks Section */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Tasks</h3>
            <button
              onClick={() => setShowCreateTask(!showCreateTask)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showCreateTask ? 'Cancel' : '+ Add Task'}
            </button>
          </div>

          {/* Create Task Form */}
          {showCreateTask && (
            <form onSubmit={handleCreateTask} style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              <h4 style={{ marginTop: 0 }}>Create New Task</h4>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({...newTask, priority: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>
              
              <button
                type="submit"
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
                Create Task
              </button>
            </form>
          )}

          {/* Tasks List */}
          {tasks.length > 0 ? (
            <div>
              {/* Task Status Filters */}
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginBottom: '20px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => {}}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  All ({tasks.length})
                </button>
                <button
                  onClick={() => {}}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Todo ({tasks.filter(t => t.status === 'todo').length})
                </button>
                <button
                  onClick={() => {}}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  In Progress ({tasks.filter(t => t.status === 'in_progress').length})
                </button>
                <button
                  onClick={() => {}}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Completed ({tasks.filter(t => t.status === 'completed').length})
                </button>
              </div>

              {/* Tasks List */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
                gap: '20px'
              }}>
                {tasks.map(task => (
                  <div key={task.id} style={{ 
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderLeft: `4px solid ${
                      task.status === 'completed' ? '#4caf50' : 
                      task.status === 'in_progress' ? '#ff9800' : '#f44336'
                    }`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{task.title}</h4>
                        
                        {task.description && (
                          <p style={{ 
                            color: '#666', 
                            fontSize: '14px', 
                            margin: '0 0 15px 0',
                            lineHeight: '1.4'
                          }}>
                            {task.description}
                          </p>
                        )}
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '14px', color: '#666' }}>
                          <div style={{ 
                            padding: '3px 8px',
                            backgroundColor: task.status === 'completed' ? '#e8f5e9' : 
                                            task.status === 'in_progress' ? '#fff3e0' : '#ffebee',
                            color: task.status === 'completed' ? '#388e3c' : 
                                   task.status === 'in_progress' ? '#f57c00' : '#d32f2f',
                            borderRadius: '12px',
                            fontWeight: 'bold'
                          }}>
                            {task.status.replace('_', ' ').toUpperCase()}
                          </div>
                          
                          <div style={{ 
                            padding: '3px 8px',
                            backgroundColor: task.priority === 'high' ? '#ffebee' : 
                                            task.priority === 'medium' ? '#fff3e0' : '#e8f5e9',
                            color: task.priority === 'high' ? '#d32f2f' : 
                                   task.priority === 'medium' ? '#f57c00' : '#388e3c',
                            borderRadius: '12px',
                            fontWeight: 'bold'
                          }}>
                            {task.priority.toUpperCase()}
                          </div>
                          
                          {task.due_date && (
                            <div style={{ 
                              padding: '3px 8px',
                              backgroundColor: '#e3f2fd',
                              color: '#1976d2',
                              borderRadius: '12px',
                              fontWeight: 'bold'
                            }}>
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          )}
                          
                          {task.assigned_to && task.assigned_to.full_name && (
                            <div style={{ 
                              padding: '3px 8px',
                              backgroundColor: '#f3e5f5',
                              color: '#7b1fa2',
                              borderRadius: '12px',
                              fontWeight: 'bold'
                            }}>
                              {task.assigned_to.full_name}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '10px' }}>
                        {/* Status Update Buttons */}
                        {task.status !== 'completed' && (
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#4caf50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Complete
                          </button>
                        )}
                        
                        {task.status === 'todo' && (
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#ff9800',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Start
                          </button>
                        )}
                        
                        {task.status === 'in_progress' && (
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'todo')}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Back to Todo
                          </button>
                        )}
                        
                        {/* Edit and Delete Buttons */}
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                      Created: {new Date(task.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              color: '#666'
            }}>
              <p style={{ fontSize: '18px', marginBottom: '10px' }}>No tasks yet</p>
              <p>Click "Add Task" to create your first task for this project</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}