const router = require('express').Router();
const pool = require('../config/db');

// GET /api/health
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      data: {
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;