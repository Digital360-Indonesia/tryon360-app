const express = require('express');
const queueManager = require('../services/queueManager');

const router = express.Router();

// GET /api/queue/status
// Get overall queue status
router.get('/status', (req, res) => {
  try {
    const status = queueManager.getStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/queue/jobs
// Get all jobs (active, pending, completed, failed)
router.get('/jobs', (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    
    // Get queue status
    const queueStatus = queueManager.getStatus();
    
    let jobs = [];
    
    if (!status || status === 'active') {
      jobs.push(...queueStatus.activeJobs.map(job => ({ ...job, type: 'active' })));
    }
    
    if (!status || status === 'pending') {
      const pendingJobs = queueManager.pendingQueue.slice(0, parseInt(limit)).map((job, index) => ({
        jobId: job.id,
        status: 'pending',
        queuePosition: index + 1,
        createdAt: job.createdAt,
        priority: job.priority,
        type: 'pending'
      }));
      jobs.push(...pendingJobs);
    }
    
    res.json({
      success: true,
      jobs: jobs.slice(0, parseInt(limit)),
      totalJobs: jobs.length
    });
  } catch (error) {
    console.error('Error getting jobs:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/queue/clear
// Clear completed and failed jobs (cleanup)
router.post('/clear', (req, res) => {
  try {
    const { olderThanHours = 24 } = req.body;
    const cleanedCount = queueManager.cleanup(olderThanHours);
    
    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} old jobs`,
      cleanedCount
    });
  } catch (error) {
    console.error('Error clearing queue:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/queue/stats
// Get queue statistics
router.get('/stats', (req, res) => {
  try {
    const status = queueManager.getStatus();
    
    // Calculate some basic stats
    const stats = {
      utilization: {
        slotsUsed: status.totalSlots - status.availableSlots,
        slotsTotal: status.totalSlots,
        utilizationPercentage: Math.round(((status.totalSlots - status.availableSlots) / status.totalSlots) * 100)
      },
      performance: {
        completedToday: status.completedToday,
        failedToday: status.failedToday,
        successRate: status.completedToday > 0 ? 
          Math.round((status.completedToday / (status.completedToday + status.failedToday)) * 100) : 0
      },
      queue: {
        currentQueueLength: status.queueLength,
        estimatedWaitTime: status.queueLength * 60 // seconds, assuming 1 min per job
      }
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;
