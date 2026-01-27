const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'tryon360-secret-key-change-in-production';

// Get MySQL pool from database config
const getPool = () => {
  const database = require('../config/database');
  return database.getPool();
};

/**
 * POST /api/auth/check-phone
 * Check if phone number exists
 */
router.post('/check-phone', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const pool = getPool();

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, phoneNumber, name, createdAt FROM users WHERE phoneNumber = ?',
      [phoneNumber]
    );

    if (users.length > 0) {
      return res.json({
        success: true,
        exists: true,
        user: users[0]
      });
    }

    res.json({
      success: true,
      exists: false
    });
  } catch (error) {
    console.error('Error checking phone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check phone number'
    });
  }
});

/**
 * POST /api/auth/login
 * Login with phone number and password
 */
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and password are required'
      });
    }

    const pool = getPool();

    // Find user
    const [users] = await pool.execute(
      'SELECT id, phoneNumber, name, password, createdAt FROM users WHERE phoneNumber = ?',
      [phoneNumber]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid phone number or password'
      });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid phone number or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    const pool = getPool();

    const [users] = await pool.execute(
      'SELECT id, phoneNumber, name, createdAt FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    const { name, phoneNumber } = req.body;

    const pool = getPool();

    // Check if phone number is being changed and if it's already taken
    if (phoneNumber && phoneNumber !== decoded.phoneNumber) {
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE phoneNumber = ? AND id != ?',
        [phoneNumber, decoded.userId]
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

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (phoneNumber) {
      updateFields.push('phoneNumber = ?');
      updateValues.push(phoneNumber);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updateFields.push('updatedAt = NOW()');
    updateValues.push(decoded.userId);

    await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated user
    const [users] = await pool.execute(
      'SELECT id, phoneNumber, name, createdAt FROM users WHERE id = ?',
      [decoded.userId]
    );

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

/**
 * PUT /api/auth/password
 * Change password
 */
router.put('/password', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters'
      });
    }

    const pool = getPool();

    // Get user with password
    const [users] = await pool.execute(
      'SELECT id, password FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = users[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.execute(
      'UPDATE users SET password = ?, updatedAt = NOW() WHERE id = ?',
      [hashedPassword, decoded.userId]
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

/**
 * POST /api/auth/create-user
 * Create a new user (admin only - for manual account creation)
 */
router.post('/create-user', async (req, res) => {
  try {
    const { phoneNumber, name, password } = req.body;

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

    const pool = getPool();

    // Check if user already exists
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
      'INSERT INTO users (phoneNumber, name, password, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())',
      [phoneNumber, name || '', hashedPassword]
    );

    // Get created user
    const [users] = await pool.execute(
      'SELECT id, phoneNumber, name, createdAt FROM users WHERE id = ?',
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

module.exports = router;
