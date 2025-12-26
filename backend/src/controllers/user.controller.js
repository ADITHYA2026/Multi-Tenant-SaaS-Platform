const pool = require('../config/db');
const bcrypt = require('bcrypt');
const audit = require('../utils/auditLogger');

/* =========================
   ADD USER TO TENANT (API 8)
========================= */
exports.addUser = async (req, res) => {
  const { tenantId } = req.params;
  const { email, password, fullName, role = 'user' } = req.body;

  // Validate input
  if (!email || !password || !fullName) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email, password, and full name are required' 
    });
  }

  if (password.length < 8) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must be at least 8 characters long' 
    });
  }

  if (!['user', 'tenant_admin'].includes(role)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid role. Must be "user" or "tenant_admin"' 
    });
  }

  // Authorization check
  if (req.user.role !== 'tenant_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Only tenant admins can add users' 
    });
  }

  // For tenant admins, ensure they're adding to their own tenant
  if (req.user.role === 'tenant_admin' && req.user.tenantId !== tenantId) {
    return res.status(403).json({ 
      success: false, 
      message: 'Cannot add users to other tenants' 
    });
  }

  try {
    // Check subscription limits
    const countRes = await pool.query(
      'SELECT COUNT(*) as user_count FROM users WHERE tenant_id = $1',
      [tenantId]
    );
    
    const limitRes = await pool.query(
      'SELECT max_users FROM tenants WHERE id = $1',
      [tenantId]
    );

    const currentCount = parseInt(countRes.rows[0].user_count);
    const maxUsers = limitRes.rows[0].max_users;

    if (currentCount >= maxUsers) {
      return res.status(403).json({
        success: false,
        message: `Subscription limit reached. Maximum ${maxUsers} users allowed.`
      });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Create user
    const userRes = await pool.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING 
         id, 
         email, 
         full_name as "fullName", 
         role, 
         is_active as "isActive", 
         created_at as "createdAt"`,
      [tenantId, email, hash, fullName, role]
    );

    // Log the action
    await audit({
      tenantId,
      userId: req.user.userId,
      action: 'CREATE_USER',
      entityType: 'user',
      entityId: userRes.rows[0].id,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userRes.rows[0]
    });
  } catch (err) {
    // Handle unique constraint violation (email per tenant)
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Email already exists in this tenant'
      });
    }
    
    console.error('Add user error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

/* =========================
   LIST TENANT USERS (API 9)
========================= */
exports.listUsers = async (req, res) => {
  const { tenantId } = req.params;
  const { search, role, page = 1, limit = 50 } = req.query;

  // Authorization check
  if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
    return res.status(403).json({ 
      success: false, 
      message: 'Forbidden' 
    });
  }

  try {
    // Build query
    let query = `
      SELECT 
        id, 
        email, 
        full_name as "fullName", 
        role, 
        is_active as "isActive", 
        created_at as "createdAt"
      FROM users 
      WHERE tenant_id = $1
    `;
    
    const params = [tenantId];
    let paramCount = 2;

    // Add search filter
    if (search) {
      query += ` AND (email ILIKE $${paramCount} OR full_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Add role filter
    if (role) {
      query += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    // Add ordering and pagination
    query += ` ORDER BY created_at DESC`;
    
    // Get total count for pagination
    const countQuery = query.replace(
      'SELECT id, email, full_name as "fullName", role, is_active as "isActive", created_at as "createdAt"',
      'SELECT COUNT(*) as total'
    );
    
    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0].total);

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    // Execute query
    const usersRes = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: usersRes.rows,
        total,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          limit: parseInt(limit),
          hasNextPage: offset + usersRes.rows.length < total,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

/* =========================
   UPDATE USER (API 10)
========================= */
exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { fullName, role, isActive } = req.body;

  try {
    // Get target user
    const targetUserRes = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (!targetUserRes.rowCount) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const targetUser = targetUserRes.rows[0];

    // Authorization checks
    if (req.user.role !== 'super_admin') {
      // Check tenant access
      if (targetUser.tenant_id !== req.user.tenantId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Cannot update users from other tenants' 
        });
      }

      // Regular users can only update themselves
      if (req.user.role === 'user' && req.user.userId !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Cannot update other users' 
        });
      }

      // Only tenant admins can update role and isActive
      if (req.user.role === 'user') {
        if (role !== undefined || isActive !== undefined) {
          return res.status(403).json({ 
            success: false, 
            message: 'Cannot update role or status' 
          });
        }
      }
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (fullName !== undefined) {
      updates.push(`full_name = $${paramCount++}`);
      values.push(fullName);
    }

    if (role !== undefined && (req.user.role === 'tenant_admin' || req.user.role === 'super_admin')) {
      if (!['user', 'tenant_admin'].includes(role)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid role' 
        });
      }
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (isActive !== undefined && (req.user.role === 'tenant_admin' || req.user.role === 'super_admin')) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No fields to update' 
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING 
        id, 
        email, 
        full_name as "fullName", 
        role, 
        is_active as "isActive", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
    `;

    const result = await pool.query(query, values);

    // Log the action
    await audit({
      tenantId: targetUser.tenant_id,
      userId: req.user.userId,
      action: 'UPDATE_USER',
      entityType: 'user',
      entityId: userId,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

/* =========================
   DELETE USER (API 11)
========================= */
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    // Check if trying to delete self
    if (userId === req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot delete yourself' 
      });
    }

    // Get target user
    const targetUserRes = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (!targetUserRes.rowCount) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const targetUser = targetUserRes.rows[0];

    // Authorization checks
    if (req.user.role !== 'super_admin') {
      if (req.user.role !== 'tenant_admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Only admins can delete users' 
        });
      }
      
      if (targetUser.tenant_id !== req.user.tenantId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Cannot delete users from other tenants' 
        });
      }
    }

    // Handle tasks assigned to this user (set assigned_to to NULL)
    await pool.query(
      'UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1',
      [userId]
    );

    // Delete user
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    // Log the action
    await audit({
      tenantId: targetUser.tenant_id,
      userId: req.user.userId,
      action: 'DELETE_USER',
      entityType: 'user',
      entityId: userId,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};