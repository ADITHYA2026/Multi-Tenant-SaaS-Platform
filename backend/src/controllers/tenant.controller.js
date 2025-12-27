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

  const { page = 1, limit = 10, status, subscriptionPlan } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT t.*,
      (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) as total_users,
      (SELECT COUNT(*) FROM projects p WHERE p.tenant_id = t.id) as total_projects
    FROM tenants t
    WHERE 1=1
  `;
  
  const params = [];
  let paramCount = 1;

  if (status) {
    query += ` AND t.status = $${paramCount++}`;
    params.push(status);
  }

  if (subscriptionPlan) {
    query += ` AND t.subscription_plan = $${paramCount++}`;
    params.push(subscriptionPlan);
  }

  query += ` ORDER BY t.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(parseInt(limit), offset);

  const tenantsRes = await pool.query(query, params);
  
  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM tenants WHERE 1=1`;
  const countRes = await pool.query(countQuery);
  const total = parseInt(countRes.rows[0].total);

  res.json({
    success: true,
    data: {
      tenants: tenantsRes.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTenants: total,
        limit: parseInt(limit)
      }
    }
  });
};