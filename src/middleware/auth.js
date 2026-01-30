const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tryon360-secret-key-change-in-production';

const getPool = () => {
  const database = require('../config/database');
  return database.getPool();
};

/**
 * checkAuth Middleware
 * Verify JWT token and attach user info to req
 */
const checkAuth = async (req, res, next) => {
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

    // Get user from database
    const pool = getPool();
    const [users] = await pool.execute(
      'SELECT id, phoneNumber, name, role, tokens FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Attach user info to request
    req.user = users[0];
    req.userId = users[0].id;
    req.userRole = users[0].role;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * requireAdmin Middleware
 * Check if user has admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

/**
 * requireUser Middleware
 * Check if user has user role (optional - for future use)
 */
const requireUser = (req, res, next) => {
  if (!req.user || req.user.role !== 'user') {
    return res.status(403).json({
      success: false,
      error: 'User access required'
    });
  }
  next();
};

module.exports = {
  checkAuth,
  requireAdmin,
  requireUser
};
