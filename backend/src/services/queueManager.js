const { v4: uuidv4 } = require('uuid');

class QueueManager {
  constructor(maxSlots = 5) {
    this.maxSlots = maxSlots;
    this.activeJobs = new Map(); // slot_id -> job_info
    this.pendingQueue = []; // jobs waiting for available slots
    this.completedJobs = new Map(); // job_id -> result
    this.failedJobs = new Map(); // job_id -> error_info
  }

  // Get current queue status
  getStatus() {
    const availableSlots = this.maxSlots - this.activeJobs.size;
    const activeJobsArray = Array.from(this.activeJobs.entries()).map(([slotId, job]) => ({
      slotId,
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      startTime: job.startTime,
      estimatedCompletion: job.estimatedCompletion
    }));

    return {
      totalSlots: this.maxSlots,
      availableSlots,
      activeJobs: activeJobsArray,
      queueLength: this.pendingQueue.length,
      completedToday: this.completedJobs.size,
      failedToday: this.failedJobs.size
    };
  }

  // Add a new job to queue
  addJob(jobData) {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      ...jobData,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      priority: jobData.priority || 'normal'
    };

    // Check if we have available slots
    if (this.activeJobs.size < this.maxSlots) {
      this.startJob(job);
    } else {
      // Add to pending queue
      this.pendingQueue.push(job);
      // Sort by priority (high priority first)
      this.pendingQueue.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    }

    return {
      jobId,
      status: job.status,
      position: job.status === 'pending' ? this.pendingQueue.findIndex(j => j.id === jobId) + 1 : 0
    };
  }

  // Start processing a job
  startJob(job) {
    const slotId = `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    job.status = 'processing';
    job.slotId = slotId;
    job.startTime = new Date();
    job.estimatedCompletion = new Date(Date.now() + 60000); // Estimate 1 minute
    
    this.activeJobs.set(slotId, job);
    
    console.log(`🚀 Started job ${job.id} in slot ${slotId}`);
    return slotId;
  }

  // Update job progress
  updateJobProgress(jobId, progress, status) {
    // Find job in active slots
    for (const [slotId, job] of this.activeJobs.entries()) {
      if (job.id === jobId) {
        job.progress = progress;
        if (status) job.status = status;
        
        console.log(`📊 Job ${jobId} progress: ${progress}% - ${status || job.status}`);
        return true;
      }
    }
    return false;
  }

  // Complete a job successfully
  completeJob(jobId, result) {
    // Find and remove from active jobs
    let completedJob = null;
    for (const [slotId, job] of this.activeJobs.entries()) {
      if (job.id === jobId) {
        completedJob = job;
        this.activeJobs.delete(slotId);
        break;
      }
    }

    if (completedJob) {
      completedJob.status = 'completed';
      completedJob.completedAt = new Date();
      completedJob.result = result;
      
      this.completedJobs.set(jobId, completedJob);
      
      console.log(`✅ Job ${jobId} completed successfully`);
      
      // Start next job in queue if available
      this.processNextInQueue();
      
      return completedJob;
    }
    
    return null;
  }

  // Fail a job
  failJob(jobId, error) {
    // Find and remove from active jobs
    let failedJob = null;
    for (const [slotId, job] of this.activeJobs.entries()) {
      if (job.id === jobId) {
        failedJob = job;
        this.activeJobs.delete(slotId);
        break;
      }
    }

    if (failedJob) {
      failedJob.status = 'failed';
      failedJob.failedAt = new Date();
      failedJob.error = error;
      
      this.failedJobs.set(jobId, failedJob);
      
      console.log(`❌ Job ${jobId} failed:`, error);
      
      // Start next job in queue if available
      this.processNextInQueue();
      
      return failedJob;
    }
    
    return null;
  }

  // Process next job in queue
  processNextInQueue() {
    if (this.pendingQueue.length > 0 && this.activeJobs.size < this.maxSlots) {
      const nextJob = this.pendingQueue.shift();
      this.startJob(nextJob);
      return nextJob;
    }
    return null;
  }

  // Get job details
  getJob(jobId) {
    // Check active jobs
    for (const job of this.activeJobs.values()) {
      if (job.id === jobId) return job;
    }
    
    // Check pending queue
    const pendingJob = this.pendingQueue.find(job => job.id === jobId);
    if (pendingJob) return pendingJob;
    
    // Check completed jobs
    if (this.completedJobs.has(jobId)) {
      return this.completedJobs.get(jobId);
    }
    
    // Check failed jobs
    if (this.failedJobs.has(jobId)) {
      return this.failedJobs.get(jobId);
    }
    
    return null;
  }

  // Cancel a job
  cancelJob(jobId) {
    // Remove from pending queue
    const pendingIndex = this.pendingQueue.findIndex(job => job.id === jobId);
    if (pendingIndex !== -1) {
      const canceledJob = this.pendingQueue.splice(pendingIndex, 1)[0];
      console.log(`🚫 Canceled pending job ${jobId}`);
      return canceledJob;
    }

    // Remove from active jobs (harder to cancel once started)
    for (const [slotId, job] of this.activeJobs.entries()) {
      if (job.id === jobId) {
        job.status = 'canceled';
        this.activeJobs.delete(slotId);
        console.log(`🚫 Canceled active job ${jobId}`);
        
        // Start next job in queue
        this.processNextInQueue();
        return job;
      }
    }

    return null;
  }

  // Get queue position for a pending job
  getQueuePosition(jobId) {
    const position = this.pendingQueue.findIndex(job => job.id === jobId);
    return position === -1 ? null : position + 1;
  }

  // Clear old completed/failed jobs (cleanup)
  cleanup(olderThanHours = 24) {
    const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
    
    let cleanedCount = 0;
    
    // Clean completed jobs
    for (const [jobId, job] of this.completedJobs.entries()) {
      if (job.completedAt < cutoffTime) {
        this.completedJobs.delete(jobId);
        cleanedCount++;
      }
    }
    
    // Clean failed jobs
    for (const [jobId, job] of this.failedJobs.entries()) {
      if (job.failedAt < cutoffTime) {
        this.failedJobs.delete(jobId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old jobs`);
    }
    
    return cleanedCount;
  }
}

// Create singleton instance
const queueManager = new QueueManager(5); // 5 slots as requested

module.exports = queueManager;
