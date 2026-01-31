const express = require('express');
const bcrypt = require('bcrypt');
const { checkAuth, requireAdmin } = require('../../middleware/auth');

const router = express.Router();

const getPool = () => {
  const database = require('../../config/database');
  return database.getPool();
};

/**
 * GET /api/admin/users
 * List all users with pagination
 */
router.get('/', checkAuth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const pool = getPool();

    let query = 'SELECT id, phoneNumber, name, role, tokens, createdAt FROM users WHERE 1=1';
    let params = [];

    if (search) {
      query += ' AND (phoneNumber LIKE ? OR name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    let countParams = [];

    if (search) {
      countQuery += ' AND (phoneNumber LIKE ? OR name LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await pool.execute(countQuery, countParams);
    const total = countRows[0].total;

    // Get users
    query += ` ORDER BY createdAt DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const [users] = await pool.execute(query, params);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list users'
    });
  }
});

/**
 * GET /api/admin/users/:id
 * Get user detail
 */
router.get('/:id', checkAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [users] = await pool.execute(
      'SELECT id, phoneNumber, name, role, tokens, createdAt FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's generation count
    const [genCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM generations WHERE userId = ?',
      [id]
    );

    res.json({
      success: true,
      user: {
        ...users[0],
        generationsCount: genCount[0].total
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

/**
 * POST /api/admin/users
 * Create new user
 */
router.post('/', checkAuth, requireAdmin, async (req, res) => {
  try {
    const { phoneNumber, name, password, role = 'user', tokens = 3 } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }

    const pool = getPool();

    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE phoneNumber = ?',
      [phoneNumber]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User with this phone number already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (phoneNumber, name, password, role, tokens, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [phoneNumber, name || '', hashedPassword, role, tokens]
    );

    // Get created user
    const [users] = await pool.execute(
      'SELECT id, phoneNumber, name, role, tokens, createdAt FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user
 */
router.put('/:id', checkAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber, password, role } = req.body;

    const pool = getPool();

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if phone number is being changed and if it's already taken
    if (phoneNumber) {
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE phoneNumber = ? AND id != ?',
        [phoneNumber, id]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Phone number already exists'
        });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (phoneNumber) {
      updateFields.push('phoneNumber = ?');
      updateValues.push(phoneNumber);
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters'
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    if (role && ['admin', 'user'].includes(role)) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updateFields.push('updatedAt = NOW()');
    updateValues.push(id);

    await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated user
    const [updatedUsers] = await pool.execute(
      'SELECT id, phoneNumber, name, role, tokens, createdAt FROM users WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      user: updatedUsers[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

/**
 * PUT /api/admin/users/:id/tokens
 * Add tokens to user
 */
router.put('/:id/tokens', checkAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    const pool = getPool();

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, tokens FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = users[0];

    // Update tokens
    const newTokens = user.tokens + amount;
    await pool.execute(
      'UPDATE users SET tokens = ?, updatedAt = NOW() WHERE id = ?',
      [newTokens, id]
    );

    // Create transaction record
    await pool.execute(
      'INSERT INTO token_transactions (userId, type, amount, description, createdAt) VALUES (?, ?, ?, ?, NOW())',
      [id, 'added', amount, `Admin added ${amount} tokens`]
    );

    res.json({
      success: true,
      message: `Successfully added ${amount} tokens`,
      previousTokens: user.tokens,
      newTokens
    });
  } catch (error) {
    console.error('Add tokens error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add tokens'
    });
  }
});

/**
 * GET /api/admin/users/:id/transactions
 * Get user's token transaction history
 */
router.get('/:id/transactions', checkAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const pool = getPool();

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get total count
    const [countRows] = await pool.execute(
      'SELECT COUNT(*) as total FROM token_transactions WHERE userId = ?',
      [id]
    );
    const total = countRows[0].total;

    // Get transactions
    const [transactions] = await pool.execute(
      `SELECT id, type, amount, description, generationId, createdAt
       FROM token_transactions
       WHERE userId = ?
       ORDER BY createdAt DESC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      [id]
    );

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transactions'
    });
  }
});

module.exports = router;
