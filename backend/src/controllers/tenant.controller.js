const pool = require('../config/db');
const audit = require('../utils/auditLogger');

exports.getTenant = async (req, res) => {
  const { tenantId } = req.params;
  const user = req.user;

  if (user.role !== 'super_admin' && user.tenantId !== tenantId) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const tenant = await pool.query('SELECT * FROM tenants WHERE id=$1', [tenantId]);
  if (!tenant.rowCount) return res.status(404).json({ success: false, message: 'Tenant not found' });

  const stats = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM users WHERE tenant_id=$1) AS total_users,
      (SELECT COUNT(*) FROM projects WHERE tenant_id=$1) AS total_projects,
      (SELECT COUNT(*) FROM tasks WHERE tenant_id=$1) AS total_tasks`,
    [tenantId]
  );

  res.json({
    success: true,
    data: { ...tenant.rows[0], stats: stats.rows[0] }
  });
};

exports.updateTenant = async (req, res) => {
  const { tenantId } = req.params;
  const user = req.user;

  if (user.role !== 'super_admin' && user.role !== 'tenant_admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  if (user.role === 'tenant_admin' && Object.keys(req.body).some(k => k !== 'name')) {
    return res.status(403).json({ success: false, message: 'Restricted fields' });
  }

  const fields = Object.keys(req.body);
  const values = Object.values(req.body);

  const setClause = fields.map((f, i) => `${f}=$${i + 1}`).join(',');

  const result = await pool.query(
    `UPDATE tenants SET ${setClause}, updated_at=NOW() WHERE id=$${fields.length + 1} RETURNING *`,
    [...values, tenantId]
  );

  await audit({
    tenantId,
    userId: user.userId,
    action: 'UPDATE_TENANT',
    entityType: 'tenant',
    entityId: tenantId,
    ip: req.ip
  });

  res.json({ success: true, message: 'Tenant updated successfully', data: result.rows[0] });
};

exports.listTenants = async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const tenants = await pool.query('SELECT * FROM tenants ORDER BY created_at DESC');
  res.json({ success: true, data: tenants.rows });
};