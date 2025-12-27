import { useEffect, useState, useContext } from 'react';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { AuthContext } from '../auth/AuthContext';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  });
  const [myTasks, setMyTasks] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Fetch projects
    api.get('/projects')
      .then(res => {
        const projectsData = res.data.data?.projects || res.data.data || [];
        setProjects(projectsData);
        
        // Calculate statistics
        const totalProjects = projectsData.length;
        let totalTasks = 0;
        let completedTasks = 0;
        
        projectsData.forEach(project => {
          totalTasks += project.task_count || 0;
          completedTasks += project.completed_task_count || 0;
        });
        
        setStats({
          totalProjects,
          totalTasks,
          completedTasks,
          pendingTasks: totalTasks - completedTasks
        });
      })
      .catch(err => console.error('Error fetching projects:', err));

    // Fetch my tasks if user is logged in
    if (user && user.id) {
      api.get('/projects?assignedTo=' + user.id)
        .then(res => {
          const allProjects = res.data.data?.projects || res.data.data || [];
          const allTasks = [];
          
          // Collect all tasks from projects
          allProjects.forEach(project => {
            // This is simplified - you might need a different endpoint
            // to get tasks assigned to current user
            if (project.tasks) {
              allTasks.push(...project.tasks);
            }
          });
          
          setMyTasks(allTasks.slice(0, 10)); // Limit to 10 tasks
        })
        .catch(err => console.error('Error fetching my tasks:', err));
    }
  }, [user]);

  return (
    <>
      <Navbar />
      <div style={{ padding: '20px' }}>
        <h2>Dashboard</h2>
        
        {/* Statistics Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{ 
            backgroundColor: '#e3f2fd', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Total Projects</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.totalProjects}</p>
          </div>
          
          <div style={{ 
            backgroundColor: '#f3e5f5', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>Total Tasks</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.totalTasks}</p>
          </div>
          
          <div style={{ 
            backgroundColor: '#e8f5e9', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#388e3c' }}>Completed Tasks</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.completedTasks}</p>
          </div>
          
          <div style={{ 
            backgroundColor: '#fff3e0', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>Pending Tasks</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.pendingTasks}</p>
          </div>
        </div>

        {/* Recent Projects Section */}
        <div style={{ marginBottom: '30px' }}>
          <h3>Recent Projects</h3>
          {projects && projects.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {projects.slice(0, 5).map(p => (
                <li key={p.id} style={{ 
                  marginBottom: '10px', 
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  borderLeft: `4px solid ${p.status === 'completed' ? '#4caf50' : p.status === 'archived' ? '#9e9e9e' : '#2196f3'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{p.name}</strong>
                      <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                        {p.description && <span>{p.description.substring(0, 100)}...</span>}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                        Status: <span style={{ 
                          color: p.status === 'completed' ? '#4caf50' : 
                                 p.status === 'archived' ? '#9e9e9e' : '#2196f3',
                          fontWeight: 'bold'
                        }}>{p.status}</span>
                        <span style={{ marginLeft: '15px' }}>Tasks: {p.task_count || 0}</span>
                      </div>
                    </div>
                    <a 
                      href={`/projects/${p.id}`}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      View
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No projects found. Create your first project!</p>
          )}
        </div>

        {/* My Tasks Section - only show if user is not super admin */}
        {user && user.role !== 'super_admin' && (
          <div>
            <h3>My Tasks</h3>
            {myTasks.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {myTasks.slice(0, 10).map(task => (
                  <li key={task.id} style={{ 
                    marginBottom: '10px', 
                    padding: '15px',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{task.title}</strong>
                        <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                          {task.description && <span>{task.description.substring(0, 100)}...</span>}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                          Status: <span style={{ 
                            color: task.status === 'completed' ? '#4caf50' : 
                                   task.status === 'in_progress' ? '#ff9800' : '#f44336',
                            fontWeight: 'bold'
                          }}>{task.status}</span>
                          {task.priority && <span style={{ marginLeft: '15px' }}>Priority: {task.priority}</span>}
                          {task.due_date && <span style={{ marginLeft: '15px' }}>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      {task.status !== 'completed' && (
                        <button
                          onClick={() => {
                            api.patch(`/tasks/${task.id}/status`, { status: 'completed' })
                              .then(() => window.location.reload())
                              .catch(err => console.error('Error completing task:', err));
                          }}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No tasks assigned to you.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}