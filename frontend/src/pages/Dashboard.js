import { useEffect, useState } from 'react';
import api from '../api/api';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api.get('/projects').then(res => setProjects(res.data.data));
  }, []);

  return (
    <>
      <Navbar />
      <h2>Dashboard</h2>
      <h3>Recent Projects</h3>
      <ul>
        {projects.slice(0,5).map(p => (
          <li key={p.id}>{p.name} ({p.task_count} tasks)</li>
        ))}
      </ul>
    </>
  );
}