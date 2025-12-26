const pool = require('../config/db');
const audit = require('../utils/auditLogger');

/* API 12: Create Project */
exports.createProject = async (req, res) => {
  const { name, description, status = 'active' } = req.body;
  const { tenantId, userId } = req.user;

 
  if (!name) {
    return res.status(400).json({ 
      success: false, 
      message: 'Project name is required' 
    });
  }

  if (status && !['active', 'archived', 'completed'].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid status value' 
    });
  }

  // Wrap in try-catch (Required for proper error handling)
  try {
    const countRes = await pool.query(
      'SELECT COUNT(*) FROM projects WHERE tenant_id=$1',
      [tenantId]
    );
    const limitRes = await pool.query(
      'SELECT max_projects FROM tenants WHERE id=$1',
      [tenantId]
    );

    if (+countRes.rows[0].count >= limitRes.rows[0].max_projects) {
      return res.status(403).json({ 
        success: false, 
        message: 'Project limit reached' 
      });
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

    // FIX RESPONSE FORMAT (Add message field)
    res.status(201).json({ 
      success: true, 
      message: 'Project created successfully', // ADD THIS
      data: project.rows[0] 
    });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

/* API 13: List Projects */
exports.listProjects = async (req, res) => {
  const { tenantId } = req.user;
  const { status, search, page = 1, limit = 20 } = req.query; // ADD QUERY PARAMS

  try {
    // MODIFY QUERY TO SUPPORT FILTERS AND PAGINATION
    let query = `
      SELECT p.*,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id=p.id) AS task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id=p.id AND t.status='completed') AS completed_task_count
      FROM projects p
      WHERE p.tenant_id=$1
    `;
    
    const params = [tenantId];
    let paramCount = 2;

    // ADD STATUS FILTER (Required feature)
    if (status) {
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // ADD SEARCH FILTER (Required feature)
    if (search) {
      query += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY p.created_at DESC`;

    // ADD PAGINATION (Required feature)
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const projects = await pool.query(query, params);

    // GET TOTAL COUNT FOR PAGINATION
    let countQuery = `SELECT COUNT(*) FROM projects WHERE tenant_id=$1`;
    const countParams = [tenantId];
    
    if (status) {
      countQuery += ` AND status = $2`;
      countParams.push(status);
    }
    
    if (search) {
      countQuery += ` AND (name ILIKE $${countParams.length + 1} OR description ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }
    
    const totalRes = await pool.query(countQuery, countParams);
    const total = parseInt(totalRes.rows[0].count);

    // FIX RESPONSE FORMAT WITH PAGINATION
    res.json({ 
      success: true, 
      message: 'Projects retrieved successfully', // ADD MESSAGE
      data: {
        projects: projects.rows,
        total: total,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          limit: parseInt(limit),
          hasNextPage: offset + projects.rows.length < total,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

/* API 14: Update Project */
exports.updateProject = async (req, res) => {
  const { projectId } = req.params;
  const { tenantId, userId, role } = req.user;

  try {
    const projectRes = await pool.query(
      'SELECT * FROM projects WHERE id=$1 AND tenant_id=$2',
      [projectId, tenantId]
    );
    
    if (!projectRes.rowCount) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    if (role !== 'tenant_admin' && projectRes.rows[0].created_by !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden' 
      });
    }

    // ADD VALIDATION FOR STATUS FIELD
    if (req.body.status && !['active', 'archived', 'completed'].includes(req.body.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status value' 
      });
    }

    const fields = Object.keys(req.body);
    const values = Object.values(req.body);
    
    // CHECK IF THERE ARE FIELDS TO UPDATE
    if (fields.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No fields to update' 
      });
    }
    
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

    res.json({ 
      success: true, 
      message: 'Project updated successfully', 
      data: updated.rows[0] 
    });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

/* API 15: Delete Project */
exports.deleteProject = async (req, res) => {
  const { projectId } = req.params;
  const { tenantId, userId, role } = req.user;

  try {
    const projectRes = await pool.query(
      'SELECT * FROM projects WHERE id=$1 AND tenant_id=$2',
      [projectId, tenantId]
    );
    
    if (!projectRes.rowCount) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    if (role !== 'tenant_admin' && projectRes.rows[0].created_by !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden' 
      });
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

    res.json({ 
      success: true, 
      message: 'Project deleted successfully' 
    });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};