const pool = require('../config/db');
const audit = require('../utils/auditLogger');

/* API 16: Create Task */
exports.createTask = async (req, res) => {
  const { projectId } = req.params;
  const { title, description, assignedTo, priority = 'medium', dueDate } = req.body;
  const { tenantId, userId } = req.user;

  const project = await pool.query(
    'SELECT tenant_id FROM projects WHERE id=$1',
    [projectId]
  );
  if (!project.rowCount || project.rows[0].tenant_id !== tenantId) {
    return res.status(403).json({ success: false, message: 'Invalid project' });
  }

  if (assignedTo) {
    const user = await pool.query(
      'SELECT id FROM users WHERE id=$1 AND tenant_id=$2',
      [assignedTo, tenantId]
    );
    if (!user.rowCount) {
      return res.status(400).json({ success: false, message: 'Invalid assignee' });
    }
  }

  const task = await pool.query(
    `INSERT INTO tasks (project_id,tenant_id,title,description,priority,assigned_to,due_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [projectId, tenantId, title, description, priority, assignedTo || null, dueDate || null]
  );

  await audit({
    tenantId,
    userId,
    action: 'CREATE_TASK',
    entityType: 'task',
    entityId: task.rows[0].id,
    ip: req.ip
  });

  res.status(201).json({ success: true, data: task.rows[0] });
};

/* API 17: List Project Tasks */
exports.listTasks = async (req, res) => {
  const { projectId } = req.params;
  const { tenantId } = req.user;

  const tasks = await pool.query(
    `SELECT t.*, u.full_name, u.email
     FROM tasks t
     LEFT JOIN users u ON t.assigned_to=u.id
     WHERE t.project_id=$1 AND t.tenant_id=$2
     ORDER BY t.priority DESC, t.due_date ASC`,
    [projectId, tenantId]
  );

  res.json({ success: true, data: tasks.rows });
};

/* API 18: Update Task Status */
exports.updateTaskStatus = async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;
  const { tenantId, userId } = req.user;

  const task = await pool.query(
    `UPDATE tasks SET status=$1, updated_at=NOW()
     WHERE id=$2 AND tenant_id=$3
     RETURNING *`,
    [status, taskId, tenantId]
  );
  if (!task.rowCount) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  await audit({
    tenantId,
    userId,
    action: 'UPDATE_TASK_STATUS',
    entityType: 'task',
    entityId: taskId,
    ip: req.ip
  });

  res.json({ success: true, data: task.rows[0] });
};

/* API 19: Update Task */
exports.updateTask = async (req, res) => {
  const { taskId } = req.params;
  const { tenantId, userId } = req.user;

  if (req.body.assignedTo) {
    const user = await pool.query(
      'SELECT id FROM users WHERE id=$1 AND tenant_id=$2',
      [req.body.assignedTo, tenantId]
    );
    if (!user.rowCount) {
      return res.status(400).json({ success: false, message: 'Invalid assignee' });
    }
  }

  const fields = Object.keys(req.body);
  const values = Object.values(req.body);
  const setClause = fields.map((f, i) => `${f}=$${i + 1}`).join(',');

  const updated = await pool.query(
    `UPDATE tasks SET ${setClause}, updated_at=NOW()
     WHERE id=$${fields.length + 1} AND tenant_id=$${fields.length + 2}
     RETURNING *`,
    [...values, taskId, tenantId]
  );

  if (!updated.rowCount) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  await audit({
    tenantId,
    userId,
    action: 'UPDATE_TASK',
    entityType: 'task',
    entityId: taskId,
    ip: req.ip
  });

  res.json({ success: true, message: 'Task updated successfully', data: updated.rows[0] });
};