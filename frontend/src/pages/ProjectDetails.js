import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';
import Navbar from '../components/Navbar';

export default function ProjectDetails() {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    api.get(`/projects/${projectId}/tasks`).then(res => setTasks(res.data.data));
  }, [projectId]);

  return (
    <>
      <Navbar />
      <h2>Tasks</h2>
      {tasks.map(t => (
        <div key={t.id}>
          {t.title} - {t.status}
          <button onClick={() => api.patch(`/tasks/${t.id}/status`,{status:'completed'}).then(()=>window.location.reload())}>
            Complete
          </button>
        </div>
      ))}
    </>
  );
}