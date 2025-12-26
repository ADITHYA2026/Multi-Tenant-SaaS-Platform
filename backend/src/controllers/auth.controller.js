const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/* =========================
   REGISTER TENANT (API-1)
========================= */
exports.registerTenant = async (req, res, next) => {
  const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tenantRes = await client.query(
      `INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects)
       VALUES ($1,$2,'active','free',5,3)
       RETURNING id`,
      [tenantName, subdomain]
    );

    const hash = await bcrypt.hash(adminPassword, 10);

    const userRes = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
       VALUES ($1,$2,$3,$4,'tenant_admin')
       RETURNING id,email,full_name,role`,
      [tenantRes.rows[0].id, adminEmail, hash, adminFullName]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: {
        tenantId: tenantRes.rows[0].id,
        subdomain,
        adminUser: userRes.rows[0]
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/* =========================
   LOGIN (API-2)
========================= */
exports.login = async (req, res) => {
  const { email, password, tenantSubdomain } = req.body;

  /* ---------- SUPER ADMIN LOGIN ---------- */
  if (!tenantSubdomain) {
    const superAdminRes = await pool.query(
      `SELECT * FROM users
       WHERE email=$1 AND role='super_admin' AND tenant_id IS NULL`,
      [email]
    );

    if (!superAdminRes.rowCount)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const user = superAdminRes.rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id, tenantId: null, role: 'super_admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: 'super_admin',
          tenantId: null
        },
        token,
        expiresIn: 86400
      }
    });
  }

  /* ---------- TENANT USER LOGIN ---------- */
  const tenantRes = await pool.query(
    `SELECT * FROM tenants WHERE subdomain=$1 AND status='active'`,
    [tenantSubdomain]
  );

  if (!tenantRes.rowCount)
    return res.status(404).json({ success: false, message: 'Tenant not found' });

  const userRes = await pool.query(
    `SELECT * FROM users WHERE email=$1 AND tenant_id=$2`,
    [email, tenantRes.rows[0].id]
  );

  if (!userRes.rowCount)
    return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const user = userRes.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid)
    return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const token = jwt.sign(
    { userId: user.id, tenantId: user.tenant_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        tenantId: user.tenant_id
      },
      token,
      expiresIn: 86400
    }
  });
};

/* =========================
   GET CURRENT USER
========================= */
exports.me = async (req, res) => {
  const result = await pool.query(
    `SELECT
        u.id,
        u.email,
        u.full_name,
        u.role,
        u.is_active,
        t.id AS tenant_id,
        t.name,
        t.subdomain,
        t.subscription_plan,
        t.max_users,
        t.max_projects
     FROM users u
     LEFT JOIN tenants t ON u.tenant_id = t.id
     WHERE u.id = $1`,
    [req.user.userId]
  );

  if (!result.rowCount)
    return res.status(404).json({ success: false, message: 'User not found' });

  res.json({ success: true, data: result.rows[0] });
};

// Add this function at the END of your existing auth.controller.js
// Right after the me() function

/* =========================
   LOGOUT (API 4)
========================= */
exports.logout = async (req, res) => {
  try {
    // Log logout action
    await audit({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      action: 'LOGOUT',
      entityType: 'user',
      entityId: req.user.userId,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};