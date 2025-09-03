const express = require('express');
const costTracker = require('../services/costTracker');

const router = express.Router();

// GET /api/costs/summary
// Get real-time cost summary
router.get('/summary', async (req, res) => {
  try {
    const summary = costTracker.getCurrentCostSummary();
    
    res.json({
      success: true,
      summary,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting cost summary:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/costs/report
// Get detailed cost report with filtering options
router.get('/report', async (req, res) => {
  try {
    const {
      period = 'today',
      groupBy = 'approach'
    } = req.query;

    const report = costTracker.getDetailedCostReport({ period, groupBy });
    
    res.json({
      success: true,
      report,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting cost report:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/costs/trend
// Get cost trend over specified number of days
router.get('/trend', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const numDays = parseInt(days);
    
    if (isNaN(numDays) || numDays < 1 || numDays > 30) {
      return res.status(400).json({
        error: 'Days parameter must be a number between 1 and 30'
      });
    }

    const trend = costTracker.getCostTrend(numDays);
    
    res.json({
      success: true,
      trend,
      period: `${numDays} days`,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting cost trend:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/costs/check-limits
// Check if current spending is within limits
router.post('/check-limits', async (req, res) => {
  try {
    const {
      dailyLimit = 10.0,
      sessionLimit = 5.0,
      hourlyLimit = 2.0
    } = req.body;

    // Validate limits
    if (typeof dailyLimit !== 'number' || dailyLimit < 0) {
      return res.status(400).json({
        error: 'Daily limit must be a positive number'
      });
    }
    if (typeof sessionLimit !== 'number' || sessionLimit < 0) {
      return res.status(400).json({
        error: 'Session limit must be a positive number'
      });
    }
    if (typeof hourlyLimit !== 'number' || hourlyLimit < 0) {
      return res.status(400).json({
        error: 'Hourly limit must be a positive number'
      });
    }

    const limitCheck = costTracker.checkCostLimits({
      dailyLimit,
      sessionLimit,
      hourlyLimit
    });
    
    res.json({
      success: true,
      limitCheck,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error checking cost limits:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/costs/reset-session
// Reset current cost tracking session
router.post('/reset-session', async (req, res) => {
  try {
    costTracker.resetSession();
    
    res.json({
      success: true,
      message: 'Cost tracking session has been reset',
      newSession: costTracker.getCurrentCostSummary().session,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error resetting cost session:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/costs/live
// Server-sent events endpoint for real-time cost updates
router.get('/live', (req, res) => {
  try {
    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial data
    const initialSummary = costTracker.getCurrentCostSummary();
    res.write(`data: ${JSON.stringify({
      type: 'summary',
      data: initialSummary,
      timestamp: Date.now()
    })}\\n\\n`);

    // Set up periodic updates every 5 seconds
    const interval = setInterval(() => {
      try {
        const summary = costTracker.getCurrentCostSummary();
        res.write(`data: ${JSON.stringify({
          type: 'summary',
          data: summary,
          timestamp: Date.now()
        })}\\n\\n`);
      } catch (error) {
        console.error('Error sending live cost update:', error);
        clearInterval(interval);
        res.end();
      }
    }, 5000);

    // Clean up on client disconnect
    req.on('close', () => {
      console.log('🔌 Live cost tracking client disconnected');
      clearInterval(interval);
      res.end();
    });

    req.on('error', (error) => {
      console.error('❌ Live cost tracking connection error:', error);
      clearInterval(interval);
      res.end();
    });

    console.log('📊 Live cost tracking client connected');

  } catch (error) {
    console.error('Error setting up live cost tracking:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/costs/dashboard
// Get comprehensive dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const summary = costTracker.getCurrentCostSummary();
    const todayReport = costTracker.getDetailedCostReport({ period: 'today', groupBy: 'approach' });
    const weekTrend = costTracker.getCostTrend(7);
    const limitCheck = costTracker.checkCostLimits();

    const dashboard = {
      summary,
      todayBreakdown: todayReport.breakdown,
      weekTrend,
      limitStatus: limitCheck,
      recentRequests: todayReport.recentRequests,
      stats: {
        averageCostPerRequest: summary.lifetime.averageCostPerRequest,
        totalRequestsToday: summary.today.requestCount,
        totalRequestsLifetime: summary.lifetime.totalRequests,
        costSavingsFromBFL: calculateBFLSavings(todayReport.recentRequests)
      }
    };
    
    res.json({
      success: true,
      dashboard,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting cost dashboard:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Helper function to calculate BFL savings
function calculateBFLSavings(recentRequests) {
  const bflRequests = recentRequests.filter(r => r.approach === 'bfl-playground');
  const standardRequests = recentRequests.filter(r => r.approach === 'standard');
  
  if (bflRequests.length === 0) return { savings: 0, percentage: 0 };
  
  const avgBflCost = bflRequests.reduce((sum, r) => sum + r.cost, 0) / bflRequests.length;
  const avgStandardCost = standardRequests.length > 0 
    ? standardRequests.reduce((sum, r) => sum + r.cost, 0) / standardRequests.length
    : 0.04; // Fallback standard cost
  
  const potentialSavings = bflRequests.length * (avgStandardCost - avgBflCost);
  const savingsPercentage = avgStandardCost > 0 ? ((avgStandardCost - avgBflCost) / avgStandardCost) * 100 : 0;
  
  return {
    savings: Math.max(0, potentialSavings),
    percentage: Math.max(0, savingsPercentage),
    bflRequestCount: bflRequests.length,
    averageBflCost: avgBflCost,
    averageStandardCost: avgStandardCost
  };
}

module.exports = router;