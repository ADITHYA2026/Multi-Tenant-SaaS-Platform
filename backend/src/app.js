require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const tenantRoutes = require('./routes/tenant.routes');
const userRoutes = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const errorHandler = require('./middleware/error.middleware');
const healthRoutes = require('./routes/health.routes');
const pool = require('./config/db');

const app = express();

/* ---------- MIDDLEWARE ---------- */
app.use(cors({
  origin: ['http://localhost:3000', 'http://frontend:3000'],
  credentials: true
}));

app.use(express.json());

/* ---------- HEALTH CHECK ---------- */
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      database: 'connected'
    });
  } catch {
    res.status(500).json({
      status: 'error',
      database: 'disconnected'
    });
  }
});

/* ---------- ROUTES ---------- */
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api', userRoutes);
app.use('/api', projectRoutes);
app.use('/api', taskRoutes);
app.use('/api', healthRoutes);

/* ---------- ERROR HANDLER ---------- */
app.use(errorHandler);

module.exports = app;