const fs = require('fs').promises;
const path = require('path');
const costTracker = require('./costTracker');

class CreditManager {
  constructor() {
    this.creditDataPath = path.join(__dirname, '../../data/credit-management.json');
    this.defaultSettings = {
      dailyLimit: 10.0,     // $10 daily limit
      sessionLimit: 5.0,    // $5 session limit
      monthlyLimit: 200.0,  // $200 monthly limit
      hourlyLimit: 2.0,     // $2 hourly limit
      warningThreshold: 0.8, // Warn at 80% of limit
      autoStopEnabled: true,  // Auto-stop when limit reached
      gracePeriod: 300000,   // 5 minutes grace period after limit
      emergencyCredits: 1.0, // $1 emergency credits
      notifications: {
        email: null,
        webhook: null,
        enabled: true
      }
    };
    this.loadCreditData();
  }

  async loadCreditData() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.creditDataPath);
      await fs.mkdir(dataDir, { recursive: true });

      try {
        const data = await fs.readFile(this.creditDataPath, 'utf8');
        this.creditData = JSON.parse(data);
        console.log('💳 Credit management data loaded successfully');
      } catch (error) {
        // File doesn't exist, create initial structure
        this.creditData = {
          settings: { ...this.defaultSettings },
          usage: {
            currentMonth: this.getCurrentMonth(),
            monthlyUsage: 0,
            lastReset: Date.now(),
            violations: [],
            emergencyUsage: 0
          },
          limits: {
            active: true,
            suspended: false,
            suspensionReason: null,
            suspensionTime: null
          },
          history: []
        };
        await this.saveCreditData();
        console.log('💳 Credit management initialized with default settings');
      }
    } catch (error) {
      console.error('❌ Error loading credit management data:', error);
      this.creditData = {
        settings: { ...this.defaultSettings },
        usage: { currentMonth: this.getCurrentMonth(), monthlyUsage: 0, lastReset: Date.now() },
        limits: { active: true, suspended: false },
        history: []
      };
    }
  }

  async saveCreditData() {
    try {
      await fs.writeFile(this.creditDataPath, JSON.stringify(this.creditData, null, 2));
    } catch (error) {
      console.error('❌ Error saving credit management data:', error);
    }
  }

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Check if a request is allowed based on current limits
   */
  async checkRequestAllowed(requestCost = 0.04, requestType = 'standard') {
    // Reset monthly usage if new month
    const currentMonth = this.getCurrentMonth();
    if (this.creditData.usage.currentMonth !== currentMonth) {
      await this.resetMonthlyUsage();
    }

    // Check if service is suspended
    if (this.creditData.limits.suspended) {
      return {
        allowed: false,
        reason: 'service_suspended',
        message: `Service suspended: ${this.creditData.limits.suspensionReason}`,
        suspensionTime: this.creditData.limits.suspensionTime
      };
    }

    // Get current cost summary from cost tracker
    const costSummary = costTracker.getCurrentCostSummary();
    const settings = this.creditData.settings;

    // Check limits in order of severity
    const checks = [
      {
        name: 'monthly',
        current: this.creditData.usage.monthlyUsage + requestCost,
        limit: settings.monthlyLimit,
        severity: 'critical'
      },
      {
        name: 'daily',
        current: costSummary.today.totalCost + requestCost,
        limit: settings.dailyLimit,
        severity: 'high'
      },
      {
        name: 'session',
        current: costSummary.session.totalCost + requestCost,
        limit: settings.sessionLimit,
        severity: 'medium'
      },
      {
        name: 'hourly',
        current: this.calculateHourlyRate(costSummary) + (requestCost / this.getSessionHours(costSummary)),
        limit: settings.hourlyLimit,
        severity: 'medium'
      }
    ];

    const violations = [];
    let criticalViolation = null;

    for (const check of checks) {
      if (check.current > check.limit) {
        const violation = {
          type: check.name,
          current: check.current,
          limit: check.limit,
          severity: check.severity,
          excess: check.current - check.limit,
          percentage: (check.current / check.limit) * 100
        };
        violations.push(violation);

        if (check.severity === 'critical') {
          criticalViolation = violation;
        }
      }
    }

    // Handle violations
    if (criticalViolation) {
      // Critical violation - check for emergency credits
      if (this.creditData.usage.emergencyUsage < settings.emergencyCredits) {
        const remainingEmergency = settings.emergencyCredits - this.creditData.usage.emergencyUsage;
        if (remainingEmergency >= requestCost) {
          await this.recordViolation(criticalViolation, 'emergency_credits_used');
          return {
            allowed: true,
            warning: true,
            reason: 'emergency_credits',
            message: `Using emergency credits. Remaining: $${(remainingEmergency - requestCost).toFixed(4)}`,
            violations,
            emergencyUsed: true
          };
        } else {
          // Suspend service
          await this.suspendService('Monthly limit exceeded and emergency credits exhausted');
          return {
            allowed: false,
            reason: 'monthly_limit_exceeded',
            message: `Monthly limit of $${settings.monthlyLimit} exceeded. Service suspended.`,
            violations
          };
        }
      } else {
        await this.suspendService('Monthly limit exceeded');
        return {
          allowed: false,
          reason: 'monthly_limit_exceeded',
          message: `Monthly limit of $${settings.monthlyLimit} exceeded`,
          violations
        };
      }
    }

    // Check for high-severity violations
    const highViolations = violations.filter(v => v.severity === 'high');
    if (highViolations.length > 0 && settings.autoStopEnabled) {
      await this.recordViolation(highViolations[0], 'auto_stopped');
      return {
        allowed: false,
        reason: 'daily_limit_exceeded',
        message: `Daily limit of $${settings.dailyLimit} would be exceeded`,
        violations,
        autoStopped: true
      };
    }

    // Check for warnings (approaching limits)
    const warnings = [];
    for (const check of checks) {
      const warningThreshold = check.limit * settings.warningThreshold;
      if (check.current > warningThreshold && check.current <= check.limit) {
        warnings.push({
          type: check.name,
          current: check.current,
          limit: check.limit,
          threshold: warningThreshold,
          percentage: (check.current / check.limit) * 100
        });
      }
    }

    return {
      allowed: true,
      warnings,
      violations: violations.filter(v => v.severity === 'medium'), // Only medium violations are warnings
      costBreakdown: {
        requestCost,
        currentDaily: costSummary.today.totalCost,
        currentSession: costSummary.session.totalCost,
        currentMonthly: this.creditData.usage.monthlyUsage
      }
    };
  }

  /**
   * Record cost after successful request
   */
  async recordCost(costEntry) {
    const { cost, approach = 'standard', emergencyUsed = false } = costEntry;

    // Update monthly usage
    if (emergencyUsed) {
      this.creditData.usage.emergencyUsage += cost;
    }
    this.creditData.usage.monthlyUsage += cost;

    // Record in history
    this.creditData.history.push({
      ...costEntry,
      timestamp: Date.now(),
      monthlyUsageAfter: this.creditData.usage.monthlyUsage,
      emergencyUsageAfter: this.creditData.usage.emergencyUsage
    });

    await this.saveCreditData();

    // Send notifications if approaching limits
    await this.checkAndSendNotifications();

    return {
      success: true,
      monthlyUsage: this.creditData.usage.monthlyUsage,
      emergencyUsage: this.creditData.usage.emergencyUsage
    };
  }

  /**
   * Update credit limits and settings
   */
  async updateSettings(newSettings) {
    // Validate settings
    const validKeys = Object.keys(this.defaultSettings);
    const updates = {};

    for (const [key, value] of Object.entries(newSettings)) {
      if (validKeys.includes(key)) {
        if (typeof value === 'number' && value >= 0) {
          updates[key] = value;
        } else if (key === 'notifications' && typeof value === 'object') {
          updates[key] = { ...this.creditData.settings.notifications, ...value };
        } else if (typeof value === 'boolean') {
          updates[key] = value;
        }
      }
    }

    // Apply updates
    this.creditData.settings = { ...this.creditData.settings, ...updates };
    await this.saveCreditData();

    console.log('💳 Credit settings updated:', Object.keys(updates));

    return {
      success: true,
      updatedSettings: this.creditData.settings,
      changes: updates
    };
  }

  /**
   * Get comprehensive credit status
   */
  getCreditStatus() {
    const costSummary = costTracker.getCurrentCostSummary();
    const settings = this.creditData.settings;

    const status = {
      limits: {
        daily: {
          limit: settings.dailyLimit,
          used: costSummary.today.totalCost,
          remaining: Math.max(0, settings.dailyLimit - costSummary.today.totalCost),
          percentage: (costSummary.today.totalCost / settings.dailyLimit) * 100
        },
        session: {
          limit: settings.sessionLimit,
          used: costSummary.session.totalCost,
          remaining: Math.max(0, settings.sessionLimit - costSummary.session.totalCost),
          percentage: (costSummary.session.totalCost / settings.sessionLimit) * 100
        },
        monthly: {
          limit: settings.monthlyLimit,
          used: this.creditData.usage.monthlyUsage,
          remaining: Math.max(0, settings.monthlyLimit - this.creditData.usage.monthlyUsage),
          percentage: (this.creditData.usage.monthlyUsage / settings.monthlyLimit) * 100
        },
        hourly: {
          limit: settings.hourlyLimit,
          currentRate: this.calculateHourlyRate(costSummary)
        }
      },
      emergency: {
        available: settings.emergencyCredits,
        used: this.creditData.usage.emergencyUsage,
        remaining: Math.max(0, settings.emergencyCredits - this.creditData.usage.emergencyUsage)
      },
      service: {
        active: this.creditData.limits.active,
        suspended: this.creditData.limits.suspended,
        suspensionReason: this.creditData.limits.suspensionReason,
        autoStopEnabled: settings.autoStopEnabled
      },
      settings: this.creditData.settings,
      currentMonth: this.creditData.usage.currentMonth,
      recentViolations: this.creditData.usage.violations?.slice(-5) || []
    };

    return status;
  }

  /**
   * Reset monthly usage for new month
   */
  async resetMonthlyUsage() {
    const currentMonth = this.getCurrentMonth();
    
    // Archive previous month's data
    this.creditData.history.push({
      type: 'monthly_reset',
      previousMonth: this.creditData.usage.currentMonth,
      monthlyUsage: this.creditData.usage.monthlyUsage,
      emergencyUsage: this.creditData.usage.emergencyUsage,
      timestamp: Date.now()
    });

    // Reset for new month
    this.creditData.usage.currentMonth = currentMonth;
    this.creditData.usage.monthlyUsage = 0;
    this.creditData.usage.emergencyUsage = 0;
    this.creditData.usage.lastReset = Date.now();
    this.creditData.usage.violations = [];

    // Auto-unsuspend if suspended for monthly limits
    if (this.creditData.limits.suspended && 
        this.creditData.limits.suspensionReason?.includes('Monthly limit')) {
      this.creditData.limits.suspended = false;
      this.creditData.limits.suspensionReason = null;
      this.creditData.limits.suspensionTime = null;
    }

    await this.saveCreditData();
    console.log(`💳 Monthly usage reset for ${currentMonth}`);
  }

  /**
   * Suspend service
   */
  async suspendService(reason) {
    this.creditData.limits.suspended = true;
    this.creditData.limits.suspensionReason = reason;
    this.creditData.limits.suspensionTime = Date.now();

    await this.saveCreditData();
    await this.sendNotification('service_suspended', { reason });
    
    console.log(`🚫 Service suspended: ${reason}`);
  }

  /**
   * Resume service (manual override)
   */
  async resumeService(overrideReason) {
    this.creditData.limits.suspended = false;
    this.creditData.limits.suspensionReason = null;
    this.creditData.limits.suspensionTime = null;

    this.creditData.history.push({
      type: 'service_resumed',
      overrideReason,
      timestamp: Date.now()
    });

    await this.saveCreditData();
    await this.sendNotification('service_resumed', { overrideReason });
    
    console.log(`✅ Service resumed: ${overrideReason}`);
  }

  /**
   * Record a limit violation
   */
  async recordViolation(violation, action) {
    const violationRecord = {
      ...violation,
      action,
      timestamp: Date.now()
    };

    if (!this.creditData.usage.violations) {
      this.creditData.usage.violations = [];
    }
    this.creditData.usage.violations.push(violationRecord);

    await this.saveCreditData();
    await this.sendNotification('limit_violation', violationRecord);
  }

  /**
   * Calculate hourly spending rate
   */
  calculateHourlyRate(costSummary) {
    const sessionHours = this.getSessionHours(costSummary);
    return sessionHours > 0 ? costSummary.session.totalCost / sessionHours : 0;
  }

  getSessionHours(costSummary) {
    return (Date.now() - costSummary.session.startTime) / (1000 * 60 * 60);
  }

  /**
   * Check and send notifications if needed
   */
  async checkAndSendNotifications() {
    if (!this.creditData.settings.notifications.enabled) return;

    const status = this.getCreditStatus();
    const warningThreshold = this.creditData.settings.warningThreshold;

    // Check for warning notifications
    Object.entries(status.limits).forEach(async ([limitType, limitData]) => {
      if (limitData.percentage && limitData.percentage >= warningThreshold * 100) {
        await this.sendNotification('approaching_limit', {
          limitType,
          percentage: limitData.percentage,
          used: limitData.used,
          limit: limitData.limit
        });
      }
    });
  }

  /**
   * Send notification (email, webhook, etc.)
   */
  async sendNotification(type, data) {
    const notifications = this.creditData.settings.notifications;
    
    console.log(`🔔 Notification [${type}]:`, data);

    // TODO: Implement actual email/webhook notifications
    // This would integrate with email service and webhook endpoints
    
    if (notifications.webhook) {
      try {
        // Example webhook call
        console.log(`📡 Would send webhook to: ${notifications.webhook}`);
      } catch (error) {
        console.error('❌ Error sending webhook notification:', error);
      }
    }

    if (notifications.email) {
      try {
        // Example email sending
        console.log(`📧 Would send email to: ${notifications.email}`);
      } catch (error) {
        console.error('❌ Error sending email notification:', error);
      }
    }
  }

  /**
   * Get spending analytics
   */
  getSpendingAnalytics(days = 30) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentHistory = this.creditData.history.filter(h => h.timestamp >= cutoff);

    const analytics = {
      totalSpent: recentHistory.reduce((sum, h) => sum + (h.cost || 0), 0),
      requestCount: recentHistory.length,
      averageCostPerRequest: 0,
      spendingByApproach: {},
      dailySpending: {},
      violations: this.creditData.usage.violations?.filter(v => v.timestamp >= cutoff) || [],
      trends: {
        increasingSpend: false,
        costPerRequestTrend: 'stable'
      }
    };

    if (analytics.requestCount > 0) {
      analytics.averageCostPerRequest = analytics.totalSpent / analytics.requestCount;
    }

    // Group by approach
    recentHistory.forEach(h => {
      const approach = h.approach || 'standard';
      if (!analytics.spendingByApproach[approach]) {
        analytics.spendingByApproach[approach] = { cost: 0, count: 0 };
      }
      analytics.spendingByApproach[approach].cost += h.cost || 0;
      analytics.spendingByApproach[approach].count += 1;
    });

    // Group by day
    recentHistory.forEach(h => {
      const day = new Date(h.timestamp).toISOString().split('T')[0];
      if (!analytics.dailySpending[day]) {
        analytics.dailySpending[day] = 0;
      }
      analytics.dailySpending[day] += h.cost || 0;
    });

    return analytics;
  }
}

// Create singleton instance
const creditManager = new CreditManager();

module.exports = creditManager;