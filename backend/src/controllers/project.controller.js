const pool = require('../config/db');
const audit = require('../utils/auditLogger');

/* API 12: Create Project */
exports.createProject = async (req, res) => {
  const { name, description, status = 'active' } = req.body;
  const { tenantId, userId } = req.user;

  const countRes = await pool.query(
    'SELECT COUNT(*) FROM projects WHERE tenant_id=$1',
    [tenantId]
  );
  const limitRes = await pool.query(
    'SELECT max_projects FROM tenants WHERE id=$1',
    [tenantId]
  );

  if (+countRes.rows[0].count >= limitRes.rows[0].max_projects) {
    return res.status(403).json({ success: false, message: 'Project limit reached' });
  }

  const project = await pool.query(
    `INSERT INTO projects (tenant_id,name,description,status,created_by)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [tenantId, name, description, status, userId]
  );

  await audit({
    tenantId,
    userId,
    action: 'CREATE_PROJECT',
    entityType: 'project',
    entityId: project.rows[0].id,
    ip: req.ip
  });

  res.status(201).json({ success: true, data: project.rows[0] });
};

/* API 13: List Projects */
exports.listProjects = async (req, res) => {
  const { tenantId } = req.user;

  const projects = await pool.query(
    `SELECT p.*,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id=p.id) AS task_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id=p.id AND t.status='completed') AS completed_task_count
     FROM projects p
     WHERE p.tenant_id=$1
     ORDER BY p.created_at DESC`,
    [tenantId]
  );

  res.json({ success: true, data: projects.rows });
};

/* API 14: Update Project */
exports.updateProject = async (req, res) => {
  const { projectId } = req.params;
  const { tenantId, userId, role } = req.user;

  const projectRes = await pool.query(
    'SELECT * FROM projects WHERE id=$1 AND tenant_id=$2',
    [projectId, tenantId]
  );
  if (!projectRes.rowCount) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  if (role !== 'tenant_admin' && projectRes.rows[0].created_by !== userId) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const fields = Object.keys(req.body);
  const values = Object.values(req.body);
  const setClause = fields.map((f, i) => `${f}=$${i + 1}`).join(',');

  const updated = await pool.query(
    `UPDATE projects SET ${setClause}, updated_at=NOW()
     WHERE id=$${fields.length + 1}
     RETURNING *`,
    [...values, projectId]
  );

  await audit({
    tenantId,
    userId,
    action: 'UPDATE_PROJECT',
    entityType: 'project',
    entityId: projectId,
    ip: req.ip
  });

  res.json({ success: true, message: 'Project updated successfully', data: updated.rows[0] });
};

/* API 15: Delete Project */
exports.deleteProject = async (req, res) => {
  const { projectId } = req.params;
  const { tenantId, userId, role } = req.user;

  const projectRes = await pool.query(
    'SELECT * FROM projects WHERE id=$1 AND tenant_id=$2',
    [projectId, tenantId]
  );
  if (!projectRes.rowCount) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  if (role !== 'tenant_admin' && projectRes.rows[0].created_by !== userId) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  await pool.query('DELETE FROM projects WHERE id=$1', [projectId]);

  await audit({
    tenantId,
    userId,
    action: 'DELETE_PROJECT',
    entityType: 'project',
    entityId: projectId,
    ip: req.ip
  });

  res.json({ success: true, message: 'Project deleted successfully' });
};