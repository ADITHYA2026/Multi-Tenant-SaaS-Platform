import { useEffect, useState } from 'react';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

export default function Projects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api.get('/projects').then(res => setProjects(res.data.data));
  }, []);

  return (
    <>
      <Navbar />
      <h2>Projects</h2>
      {projects.map(p => (
        <div key={p.id}>
          <Link to={`/projects/${p.id}`}>{p.name}</Link>
          <button onClick={() => api.delete(`/projects/${p.id}`).then(()=>window.location.reload())}>Delete</button>
        </div>
      ))}
    </>
  );
}