const pool = require('../config/db');
const audit = require('../utils/auditLogger');

// API 4: Logout
exports.logout = async (req, res) => {
  // For JWT-only, just return success (client removes token)
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
};

// API 10: Update User (complete version)
exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { fullName, role, isActive } = req.body;
  const currentUser = req.user;

  try {
    // Check if user exists and belongs to same tenant
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (!userCheck.rowCount) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const targetUser = userCheck.rows[0];

    // Authorization checks
    if (currentUser.role !== 'super_admin') {
      if (targetUser.tenant_id !== currentUser.tenantId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      if (currentUser.role !== 'tenant_admin') {
        // Regular users can only update their own fullName
        if (currentUser.userId !== userId) {
          return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        if (fullName === undefined) {
          return res.status(403).json({ success: false, message: 'Cannot update other fields' });
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

    if (role !== undefined && currentUser.role === 'tenant_admin') {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (isActive !== undefined && currentUser.role === 'tenant_admin') {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, full_name, role, is_active, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    await audit({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 11: Delete User (complete version)
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;
  const currentUser = req.user;

  try {
    // Check if trying to delete self
    if (currentUser.userId === userId) {
      return res.status(403).json({ success: false, message: 'Cannot delete yourself' });
    }

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (!userCheck.rowCount) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const targetUser = userCheck.rows[0];

    // Authorization checks
    if (currentUser.role !== 'super_admin') {
      if (currentUser.role !== 'tenant_admin') {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      
      if (targetUser.tenant_id !== currentUser.tenantId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    // Delete user
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    await audit({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
};