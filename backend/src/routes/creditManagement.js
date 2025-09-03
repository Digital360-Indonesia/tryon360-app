const express = require('express');
const creditManager = require('../services/creditManager');

const router = express.Router();

// GET /api/credit-management/status
// Get comprehensive credit status
router.get('/status', async (req, res) => {
  try {
    const status = creditManager.getCreditStatus();
    
    res.json({
      success: true,
      status,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting credit status:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/credit-management/check-request
// Check if a request is allowed before processing
router.post('/check-request', async (req, res) => {
  try {
    const {
      requestCost = 0.04,
      requestType = 'standard'
    } = req.body;

    if (typeof requestCost !== 'number' || requestCost < 0) {
      return res.status(400).json({
        error: 'Request cost must be a positive number'
      });
    }

    const result = await creditManager.checkRequestAllowed(requestCost, requestType);
    
    res.json({
      success: true,
      result,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error checking request allowance:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/credit-management/record-cost
// Record cost after successful request
router.post('/record-cost', async (req, res) => {
  try {
    const costEntry = req.body;

    if (!costEntry.cost || typeof costEntry.cost !== 'number') {
      return res.status(400).json({
        error: 'Cost is required and must be a number'
      });
    }

    const result = await creditManager.recordCost(costEntry);
    
    res.json({
      success: true,
      result,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error recording cost:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// PUT /api/credit-management/settings
// Update credit management settings
router.put('/settings', async (req, res) => {
  try {
    const newSettings = req.body;

    const result = await creditManager.updateSettings(newSettings);
    
    res.json({
      success: true,
      result,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error updating credit settings:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/credit-management/suspend
// Manually suspend service
router.post('/suspend', async (req, res) => {
  try {
    const { reason = 'Manual suspension' } = req.body;

    await creditManager.suspendService(reason);
    
    res.json({
      success: true,
      message: 'Service suspended successfully',
      reason,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error suspending service:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/credit-management/resume
// Manually resume service
router.post('/resume', async (req, res) => {
  try {
    const { overrideReason = 'Manual override' } = req.body;

    await creditManager.resumeService(overrideReason);
    
    res.json({
      success: true,
      message: 'Service resumed successfully',
      overrideReason,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error resuming service:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/credit-management/reset-monthly
// Reset monthly usage (for testing or manual override)
router.post('/reset-monthly', async (req, res) => {
  try {
    await creditManager.resetMonthlyUsage();
    
    res.json({
      success: true,
      message: 'Monthly usage reset successfully',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error resetting monthly usage:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/credit-management/analytics
// Get spending analytics
router.get('/analytics', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const numDays = parseInt(days);
    
    if (isNaN(numDays) || numDays < 1 || numDays > 365) {
      return res.status(400).json({
        error: 'Days parameter must be a number between 1 and 365'
      });
    }

    const analytics = creditManager.getSpendingAnalytics(numDays);
    
    res.json({
      success: true,
      analytics,
      period: `${numDays} days`,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting spending analytics:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/credit-management/limits-preview
// Preview what would happen with different limit settings
router.get('/limits-preview', async (req, res) => {
  try {
    const {
      dailyLimit,
      sessionLimit,
      monthlyLimit,
      hourlyLimit
    } = req.query;

    const currentStatus = creditManager.getCreditStatus();
    const preview = {
      current: currentStatus,
      projected: {}
    };

    // Calculate projected impact with new limits
    if (dailyLimit) {
      const newDaily = parseFloat(dailyLimit);
      preview.projected.daily = {
        newLimit: newDaily,
        wouldExceed: currentStatus.limits.daily.used > newDaily,
        newPercentage: (currentStatus.limits.daily.used / newDaily) * 100
      };
    }

    if (sessionLimit) {
      const newSession = parseFloat(sessionLimit);
      preview.projected.session = {
        newLimit: newSession,
        wouldExceed: currentStatus.limits.session.used > newSession,
        newPercentage: (currentStatus.limits.session.used / newSession) * 100
      };
    }

    if (monthlyLimit) {
      const newMonthly = parseFloat(monthlyLimit);
      preview.projected.monthly = {
        newLimit: newMonthly,
        wouldExceed: currentStatus.limits.monthly.used > newMonthly,
        newPercentage: (currentStatus.limits.monthly.used / newMonthly) * 100
      };
    }

    if (hourlyLimit) {
      const newHourly = parseFloat(hourlyLimit);
      preview.projected.hourly = {
        newLimit: newHourly,
        wouldExceed: currentStatus.limits.hourly.currentRate > newHourly,
        currentRate: currentStatus.limits.hourly.currentRate
      };
    }
    
    res.json({
      success: true,
      preview,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error generating limits preview:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/credit-management/violations
// Get recent limit violations
router.get('/violations', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const maxLimit = Math.min(parseInt(limit) || 20, 100);
    
    const status = creditManager.getCreditStatus();
    const allViolations = status.recentViolations || [];
    
    // Sort by timestamp (newest first) and limit results
    const violations = allViolations
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxLimit);

    res.json({
      success: true,
      violations,
      total: allViolations.length,
      showing: violations.length,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting violations:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/credit-management/test-limits
// Test limit checking with hypothetical requests (for development/testing)
router.post('/test-limits', async (req, res) => {
  try {
    const { requests = [] } = req.body;

    if (!Array.isArray(requests)) {
      return res.status(400).json({
        error: 'Requests must be an array'
      });
    }

    const results = [];
    let cumulativeCost = 0;

    for (const [index, request] of requests.entries()) {
      const { cost = 0.04, type = 'standard' } = request;
      cumulativeCost += cost;

      const result = await creditManager.checkRequestAllowed(cost, type);
      results.push({
        index,
        request: { cost, type },
        result,
        cumulativeCost
      });

      // Stop testing if a request would be blocked
      if (!result.allowed) {
        break;
      }
    }

    res.json({
      success: true,
      testResults: results,
      totalTestedRequests: results.length,
      wouldBeBlocked: results.some(r => !r.result.allowed),
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error testing limits:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;