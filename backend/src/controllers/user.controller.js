const pool = require('../config/db');
const bcrypt = require('bcrypt');
const audit = require('../utils/auditLogger');

exports.addUser = async (req, res) => {
  const { tenantId } = req.params;
  const { email, password, fullName, role = 'user' } = req.body;

  if (req.user.role !== 'tenant_admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const count = await pool.query('SELECT COUNT(*) FROM users WHERE tenant_id=$1', [tenantId]);
  const limits = await pool.query('SELECT max_users FROM tenants WHERE id=$1', [tenantId]);

  if (parseInt(count.rows[0].count) >= limits.rows[0].max_users) {
    return res.status(403).json({ success: false, message: 'Subscription limit reached' });
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await pool.query(
    `INSERT INTO users (tenant_id,email,password_hash,full_name,role)
     VALUES ($1,$2,$3,$4,$5) RETURNING id,email,full_name,role,is_active,created_at`,
    [tenantId, email, hash, fullName, role]
  );

  await audit({
    tenantId,
    userId: req.user.userId,
    action: 'CREATE_USER',
    entityType: 'user',
    entityId: user.rows[0].id,
    ip: req.ip
  });

  res.status(201).json({ success: true, message: 'User created successfully', data: user.rows[0] });
};

exports.listUsers = async (req, res) => {
  const { tenantId } = req.params;

  if (req.user.tenantId !== tenantId && req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const users = await pool.query(
    `SELECT id,email,full_name,role,is_active,created_at
     FROM users WHERE tenant_id=$1 ORDER BY created_at DESC`,
    [tenantId]
  );

  res.json({ success: true, data: users.rows });
};

exports.updateUser = async (req, res) => {
  const { userId } = req.params;

  const fields = Object.keys(req.body);
  const values = Object.values(req.body);
  const setClause = fields.map((f, i) => `${f}=$${i + 1}`).join(',');

  const user = await pool.query(
    `UPDATE users SET ${setClause}, updated_at=NOW() WHERE id=$${fields.length + 1} RETURNING *`,
    [...values, userId]
  );

  res.json({ success: true, message: 'User updated successfully', data: user.rows[0] });
};

exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  if (userId === req.user.userId) {
    return res.status(403).json({ success: false, message: 'Cannot delete self' });
  }

  await pool.query('DELETE FROM users WHERE id=$1', [userId]);

  res.json({ success: true, message: 'User deleted successfully' });
};