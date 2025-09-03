const fs = require('fs').promises;
const path = require('path');

class CostTracker {
  constructor() {
    this.costLogPath = path.join(__dirname, '../../data/cost-tracking.json');
    this.currentSession = {
      startTime: Date.now(),
      totalCost: 0,
      requestCount: 0,
      costs: []
    };
    this.loadPersistentData();
  }

  async loadPersistentData() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.costLogPath);
      await fs.mkdir(dataDir, { recursive: true });

      // Load existing cost data if it exists
      try {
        const data = await fs.readFile(this.costLogPath, 'utf8');
        const costData = JSON.parse(data);
        
        // Initialize daily totals if not exists
        if (!costData.dailyTotals) {
          costData.dailyTotals = {};
        }
        
        this.persistentData = costData;
        console.log('💰 Cost tracking data loaded successfully');
      } catch (error) {
        // File doesn't exist, create initial structure
        this.persistentData = {
          totalLifetimeCost: 0,
          dailyTotals: {},
          sessions: [],
          requests: []
        };
        await this.savePersistentData();
        console.log('💰 Cost tracking initialized with new data file');
      }
    } catch (error) {
      console.error('❌ Error loading cost tracking data:', error);
      this.persistentData = {
        totalLifetimeCost: 0,
        dailyTotals: {},
        sessions: [],
        requests: []
      };
    }
  }

  async savePersistentData() {
    try {
      await fs.writeFile(this.costLogPath, JSON.stringify(this.persistentData, null, 2));
      console.log('💾 Cost tracking data saved');
    } catch (error) {
      console.error('❌ Error saving cost tracking data:', error);
    }
  }

  /**
   * Record a new cost entry
   */
  async recordCost(costEntry) {
    const {
      jobId,
      modelUsed,
      approach = 'standard',
      cost,
      timestamp = Date.now(),
      quality = 'standard',
      modelId,
      garmentType,
      status = 'completed'
    } = costEntry;

    // Add to current session
    this.currentSession.totalCost += cost;
    this.currentSession.requestCount += 1;
    this.currentSession.costs.push({
      jobId,
      modelUsed,
      approach,
      cost,
      timestamp,
      quality,
      modelId,
      garmentType,
      status
    });

    // Add to persistent data
    this.persistentData.totalLifetimeCost += cost;
    this.persistentData.requests.push({
      jobId,
      modelUsed,
      approach,
      cost,
      timestamp,
      quality,
      modelId,
      garmentType,
      status
    });

    // Update daily totals
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    if (!this.persistentData.dailyTotals[today]) {
      this.persistentData.dailyTotals[today] = 0;
    }
    this.persistentData.dailyTotals[today] += cost;

    // Save immediately for real-time persistence
    await this.savePersistentData();

    console.log(`💰 Cost recorded: $${cost.toFixed(4)} for ${approach} (${modelUsed})`);
    console.log(`📊 Session total: $${this.currentSession.totalCost.toFixed(4)}`);
    console.log(`🏦 Lifetime total: $${this.persistentData.totalLifetimeCost.toFixed(4)}`);

    return {
      success: true,
      sessionTotal: this.currentSession.totalCost,
      lifetimeTotal: this.persistentData.totalLifetimeCost,
      dailyTotal: this.persistentData.dailyTotals[today]
    };
  }

  /**
   * Get real-time cost summary
   */
  getCurrentCostSummary() {
    const today = new Date().toISOString().split('T')[0];
    const dailyTotal = this.persistentData.dailyTotals[today] || 0;

    return {
      session: {
        startTime: this.currentSession.startTime,
        duration: Date.now() - this.currentSession.startTime,
        totalCost: this.currentSession.totalCost,
        requestCount: this.currentSession.requestCount,
        averageCostPerRequest: this.currentSession.requestCount > 0 
          ? this.currentSession.totalCost / this.currentSession.requestCount 
          : 0
      },
      today: {
        date: today,
        totalCost: dailyTotal,
        requestCount: this.persistentData.requests.filter(r => 
          new Date(r.timestamp).toISOString().split('T')[0] === today
        ).length
      },
      lifetime: {
        totalCost: this.persistentData.totalLifetimeCost,
        totalRequests: this.persistentData.requests.length,
        averageCostPerRequest: this.persistentData.requests.length > 0
          ? this.persistentData.totalLifetimeCost / this.persistentData.requests.length
          : 0
      }
    };
  }

  /**
   * Get detailed cost breakdown
   */
  getDetailedCostReport(options = {}) {
    const {
      period = 'today', // 'today', 'week', 'month', 'all'
      groupBy = 'approach' // 'approach', 'model', 'quality'
    } = options;

    let filteredRequests = [...this.persistentData.requests];

    // Filter by period
    const now = new Date();
    if (period === 'today') {
      const today = now.toISOString().split('T')[0];
      filteredRequests = filteredRequests.filter(r => 
        new Date(r.timestamp).toISOString().split('T')[0] === today
      );
    } else if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredRequests = filteredRequests.filter(r => 
        new Date(r.timestamp) >= weekAgo
      );
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredRequests = filteredRequests.filter(r => 
        new Date(r.timestamp) >= monthAgo
      );
    }

    // Group by specified field
    const grouped = {};
    filteredRequests.forEach(request => {
      const key = request[groupBy] || 'unknown';
      if (!grouped[key]) {
        grouped[key] = {
          count: 0,
          totalCost: 0,
          requests: []
        };
      }
      grouped[key].count += 1;
      grouped[key].totalCost += request.cost;
      grouped[key].requests.push(request);
    });

    // Calculate percentages and averages
    const totalCost = filteredRequests.reduce((sum, r) => sum + r.cost, 0);
    Object.keys(grouped).forEach(key => {
      grouped[key].percentage = totalCost > 0 ? (grouped[key].totalCost / totalCost) * 100 : 0;
      grouped[key].averageCost = grouped[key].totalCost / grouped[key].count;
    });

    return {
      period,
      groupBy,
      summary: {
        totalCost,
        totalRequests: filteredRequests.length,
        averageCost: filteredRequests.length > 0 ? totalCost / filteredRequests.length : 0
      },
      breakdown: grouped,
      recentRequests: filteredRequests.slice(-10) // Last 10 requests
    };
  }

  /**
   * Get cost trend over time
   */
  getCostTrend(days = 7) {
    const trend = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRequests = this.persistentData.requests.filter(r => 
        new Date(r.timestamp).toISOString().split('T')[0] === dateStr
      );

      trend.push({
        date: dateStr,
        totalCost: this.persistentData.dailyTotals[dateStr] || 0,
        requestCount: dayRequests.length,
        approaches: this.groupRequestsByApproach(dayRequests)
      });
    }

    return trend;
  }

  groupRequestsByApproach(requests) {
    const approaches = {};
    requests.forEach(request => {
      const approach = request.approach || 'standard';
      if (!approaches[approach]) {
        approaches[approach] = { count: 0, cost: 0 };
      }
      approaches[approach].count += 1;
      approaches[approach].cost += request.cost;
    });
    return approaches;
  }

  /**
   * Check if cost limit is exceeded
   */
  checkCostLimits(limits = {}) {
    const {
      dailyLimit = 10.0, // $10 default daily limit
      sessionLimit = 5.0, // $5 default session limit
      hourlyLimit = 2.0   // $2 default hourly limit
    } = limits;

    const summary = this.getCurrentCostSummary();
    const warnings = [];

    // Check daily limit
    if (summary.today.totalCost >= dailyLimit) {
      warnings.push({
        type: 'daily_limit_exceeded',
        message: `Daily spending limit of $${dailyLimit} has been exceeded (current: $${summary.today.totalCost.toFixed(4)})`,
        severity: 'high'
      });
    } else if (summary.today.totalCost >= dailyLimit * 0.8) {
      warnings.push({
        type: 'daily_limit_warning',
        message: `Daily spending is approaching limit: $${summary.today.totalCost.toFixed(4)} / $${dailyLimit}`,
        severity: 'medium'
      });
    }

    // Check session limit
    if (summary.session.totalCost >= sessionLimit) {
      warnings.push({
        type: 'session_limit_exceeded',
        message: `Session spending limit of $${sessionLimit} has been exceeded (current: $${summary.session.totalCost.toFixed(4)})`,
        severity: 'high'
      });
    }

    // Check hourly rate
    const sessionHours = (Date.now() - this.currentSession.startTime) / (1000 * 60 * 60);
    const hourlyRate = sessionHours > 0 ? this.currentSession.totalCost / sessionHours : 0;
    if (hourlyRate >= hourlyLimit) {
      warnings.push({
        type: 'hourly_rate_exceeded',
        message: `Hourly spending rate of $${hourlyRate.toFixed(4)}/hour exceeds limit of $${hourlyLimit}/hour`,
        severity: 'medium'
      });
    }

    return {
      withinLimits: warnings.filter(w => w.severity === 'high').length === 0,
      warnings,
      summary
    };
  }

  /**
   * Reset current session (useful for new work sessions)
   */
  resetSession() {
    // Save current session to persistent data
    if (this.currentSession.requestCount > 0) {
      this.persistentData.sessions.push({
        ...this.currentSession,
        endTime: Date.now()
      });
    }

    // Start new session
    this.currentSession = {
      startTime: Date.now(),
      totalCost: 0,
      requestCount: 0,
      costs: []
    };

    this.savePersistentData();
    console.log('🔄 Cost tracking session reset');
  }
}

// Create singleton instance
const costTracker = new CostTracker();

module.exports = costTracker;