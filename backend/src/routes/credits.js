const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// In-memory credit storage (in production, use a database)
let creditHistory = [];
let creditSummary = {
  totalUsed: 0,
  totalCost: 0,
  todayUsed: 0,
  todayCost: 0,
  monthlyUsed: 0,
  monthlyCost: 0
};

// Load credit data from file on startup
const loadCreditData = async () => {
  try {
    const dataPath = path.join(__dirname, '../../data/credits.json');
    const data = await fs.readFile(dataPath, 'utf8');
    const parsed = JSON.parse(data);
    creditHistory = parsed.history || [];
    creditSummary = parsed.summary || creditSummary;
    console.log('✅ Credit data loaded from file');
  } catch (error) {
    console.log('📊 No existing credit data found, starting fresh');
  }
};

// Save credit data to file
const saveCreditData = async () => {
  try {
    const dataPath = path.join(__dirname, '../../data/credits.json');
    const dataDir = path.dirname(dataPath);
    
    // Ensure data directory exists
    await fs.mkdir(dataDir, { recursive: true });
    
    const data = {
      history: creditHistory,
      summary: creditSummary,
      lastUpdated: new Date().toISOString()
    };
    
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error saving credit data:', error);
  }
};

// Initialize credit data
loadCreditData();

// Record a credit usage
const recordCreditUsage = (jobData) => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const thisMonth = now.toISOString().substring(0, 7);
  
  const record = {
    jobId: jobData.jobId,
    timestamp: now.toISOString(),
    modelUsed: jobData.modelUsed || 'flux',
    quality: jobData.quality || 'standard',
    status: jobData.status || 'completed',
    cost: jobData.cost || 0.04,
    modelId: jobData.modelId,
    garmentType: jobData.garmentType
  };
  
  // Add to history
  creditHistory.unshift(record); // Add to beginning
  
  // Update summary
  creditSummary.totalUsed += 1;
  creditSummary.totalCost += record.cost;
  
  // Update today's stats
  const todayRecords = creditHistory.filter(r => r.timestamp.startsWith(today));
  creditSummary.todayUsed = todayRecords.length;
  creditSummary.todayCost = todayRecords.reduce((sum, r) => sum + r.cost, 0);
  
  // Update monthly stats
  const monthlyRecords = creditHistory.filter(r => r.timestamp.startsWith(thisMonth));
  creditSummary.monthlyUsed = monthlyRecords.length;
  creditSummary.monthlyCost = monthlyRecords.reduce((sum, r) => sum + r.cost, 0);
  
  // Keep only last 1000 records to prevent memory issues
  if (creditHistory.length > 1000) {
    creditHistory = creditHistory.slice(0, 1000);
  }
  
  // Save to file
  saveCreditData();
  
  console.log(`💳 Credit recorded: ${record.cost} USD for job ${record.jobId}`);
};

// GET /api/credits/summary
router.get('/summary', (req, res) => {
  try {
    const { range = 'all' } = req.query;
    const now = new Date();
    
    let filteredHistory = creditHistory;
    
    // Filter by date range
    if (range === 'today') {
      const today = now.toISOString().split('T')[0];
      filteredHistory = creditHistory.filter(r => r.timestamp.startsWith(today));
    } else if (range === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredHistory = creditHistory.filter(r => new Date(r.timestamp) >= weekAgo);
    } else if (range === 'month') {
      const thisMonth = now.toISOString().substring(0, 7);
      filteredHistory = creditHistory.filter(r => r.timestamp.startsWith(thisMonth));
    }
    
    // Calculate summary for filtered data
    const summary = {
      totalUsed: filteredHistory.length,
      totalCost: filteredHistory.reduce((sum, r) => sum + r.cost, 0),
      todayUsed: creditSummary.todayUsed,
      todayCost: creditSummary.todayCost,
      monthlyUsed: creditSummary.monthlyUsed,
      monthlyCost: creditSummary.monthlyCost,
      averageCost: filteredHistory.length > 0 ? 
        filteredHistory.reduce((sum, r) => sum + r.cost, 0) / filteredHistory.length : 0
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting credit summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/credits/history
router.get('/history', (req, res) => {
  try {
    const { range = 'all', limit = 50, offset = 0 } = req.query;
    const now = new Date();
    
    let filteredHistory = creditHistory;
    
    // Filter by date range
    if (range === 'today') {
      const today = now.toISOString().split('T')[0];
      filteredHistory = creditHistory.filter(r => r.timestamp.startsWith(today));
    } else if (range === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredHistory = creditHistory.filter(r => new Date(r.timestamp) >= weekAgo);
    } else if (range === 'month') {
      const thisMonth = now.toISOString().substring(0, 7);
      filteredHistory = creditHistory.filter(r => r.timestamp.startsWith(thisMonth));
    }
    
    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedHistory = filteredHistory.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedHistory,
      total: filteredHistory.length,
      offset: startIndex,
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error getting credit history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/credits/export
router.get('/export', async (req, res) => {
  try {
    const { range = 'all' } = req.query;
    const now = new Date();
    
    let filteredHistory = creditHistory;
    
    // Filter by date range
    if (range === 'today') {
      const today = now.toISOString().split('T')[0];
      filteredHistory = creditHistory.filter(r => r.timestamp.startsWith(today));
    } else if (range === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredHistory = creditHistory.filter(r => new Date(r.timestamp) >= weekAgo);
    } else if (range === 'month') {
      const thisMonth = now.toISOString().substring(0, 7);
      filteredHistory = creditHistory.filter(r => r.timestamp.startsWith(thisMonth));
    }
    
    // Generate CSV
    const csvHeader = 'Date,Time,Job ID,Model Used,Quality,Status,Cost,Model ID,Garment Type\n';
    const csvRows = filteredHistory.map(record => {
      const date = new Date(record.timestamp);
      return [
        date.toISOString().split('T')[0],
        date.toTimeString().split(' ')[0],
        record.jobId,
        record.modelUsed,
        record.quality,
        record.status,
        record.cost.toFixed(4),
        record.modelId || '',
        record.garmentType || ''
      ].join(',');
    }).join('\n');
    
    const csv = csvHeader + csvRows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="credit-report-${range}-${now.toISOString().split('T')[0]}.csv"`);
    res.send(csv);
    
  } catch (error) {
    console.error('Error exporting credit report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/credits/record (internal use)
router.post('/record', (req, res) => {
  try {
    const jobData = req.body;
    recordCreditUsage(jobData);
    
    res.json({
      success: true,
      message: 'Credit usage recorded'
    });
  } catch (error) {
    console.error('Error recording credit usage:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export the record function for internal use
module.exports = {
  router,
  recordCreditUsage
};