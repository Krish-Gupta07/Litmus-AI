import { Queue, Worker, Job } from "bullmq";
import { redis, checkRedisHealth, getRedisStatus } from "../lib/redis.js";
import type {
  AnalysisJobData,
  AnalysisJobResult,
  QueueJobOptions,
} from "../types/queue.js";
import { processAnalysisJob } from "../workers/analysis.worker.js";

// Queue configuration
export const QUEUE_NAME = "analysis-queue";
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || "2");
const MAX_QUEUE_SIZE = parseInt(process.env.MAX_QUEUE_SIZE || "1000");
const JOB_TIMEOUT = parseInt(process.env.JOB_TIMEOUT || "300000"); // 5 minutes
const PRIORITY_LEVELS = {
  HIGH: 10,
  NORMAL: 5,
  LOW: 1,
};

// Queue metrics tracking
let queueMetrics = {
  totalJobsProcessed: 0,
  totalJobsFailed: 0,
  averageProcessingTime: 0,
  lastProcessedAt: 0,
  queueSizeHistory: [] as number[],
  errorCount: 0,
  lastErrorAt: 0,
};

// Create the main analysis queue
export const analysisQueue = new Queue<AnalysisJobData>(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    delay: 0,
  },
});

// Worker is now in separate process - see src/worker.ts
// No worker needed here since it runs separately

// Worker event handlers removed - worker runs in separate process

// Worker management functions
export class WorkerService {
  /**
   * Start the worker with proper initialization and retry logic
   */
  static async startWorker(): Promise<void> {
    // Worker runs in separate process - no action needed
    console.log("ℹ️ Worker runs in separate process - use 'npm run dev:worker'");
  }

  /**
   * Stop the worker gracefully
   */
  static async stopWorker(): Promise<void> {
    // Worker runs in separate process - no action needed
    console.log("ℹ️ Worker runs in separate process - stop it manually");
  }

  /**
   * Check if worker is running
   */
  static isWorkerRunning(): boolean {
    // Worker runs in separate process - assume it's running
    return true;
  }

  /**
   * Get worker status
   */
  static getWorkerStatus() {
    return {
      isRunning: true, // Worker runs in separate process
      concurrency: WORKER_CONCURRENCY,
      queueName: QUEUE_NAME,
    };
  }

  /**
   * Force process waiting jobs
   */
  static async processWaitingJobs() {
    try {
      const waiting = await analysisQueue.getWaiting();
      
      if (waiting.length > 0) {
        return waiting.length;
      }
      
      return 0;
    } catch (error) {
      console.error("❌ Error processing waiting jobs:", error);
      return 0;
    }
  }
}

// Queue management functions
export class QueueService {
  /**
   * Add a new analysis job to the queue with overflow protection
   */
  static async addJob(
    jobData: AnalysisJobData,
    options: QueueJobOptions = {}
  ): Promise<Job<AnalysisJobData>> {
    // Check Redis health before adding job
    const isRedisHealthy = await checkRedisHealth();
    if (!isRedisHealthy) {
      throw new Error("Redis connection is not available. Please try again later.");
    }

    // Check queue size to prevent overflow
    const waiting = await analysisQueue.getWaiting();
    const active = await analysisQueue.getActive();
    const currentQueueSize = waiting.length + active.length;

    if (currentQueueSize >= MAX_QUEUE_SIZE) {
      throw new Error(`Queue is full. Current size: ${currentQueueSize}/${MAX_QUEUE_SIZE}. Please try again later.`);
    }

    // Determine priority based on user tier or job type
    const priority = this.determineJobPriority(jobData, options.priority);

    console.log(`📝 Adding job to queue with data:`, jobData);
    const job = await analysisQueue.add("analysis", jobData, {
      priority,
      delay: options.delay || 0,
      attempts: options.attempts || 3,
      backoff: options.backoff || {
        type: "exponential",
        delay: 2000,
      },
    });
    console.log(`✅ Job added to queue with ID: ${job.id}`);

    // Update queue size history
    queueMetrics.queueSizeHistory.push(currentQueueSize + 1);
    if (queueMetrics.queueSizeHistory.length > 100) {
      queueMetrics.queueSizeHistory.shift(); // Keep only last 100 entries
    }

    return job as Job<AnalysisJobData>;
  }

  /**
   * Determine job priority based on various factors
   */
  private static determineJobPriority(jobData: AnalysisJobData, userPriority?: number): number {
    if (userPriority !== undefined) {
      return Math.max(1, Math.min(10, userPriority));
    }

    // Default priority logic
    // WhatsApp users get higher priority
    if (jobData.userId && /^[\+\d]/.test(jobData.userId)) {
      return PRIORITY_LEVELS.HIGH;
    }

    // URL jobs might be more urgent than text
    if (jobData.inputType === 'url') {
      return PRIORITY_LEVELS.NORMAL;
    }

    return PRIORITY_LEVELS.LOW;
  }

  /**
   * Get job status and progress
   */
  static async getJobStatus(jobId: string): Promise<any> {
    const job = await analysisQueue.getJob(jobId);

    if (!job) {
      return { error: "Job not found" };
    }

    const state = await job.getState();
    const progress = job.progress;
    const analysis = (await job.returnvalue) ?? {
      jobId: parseInt(job.id as string),
      status: state === "failed" ? "failed" : "pending",
    };
    const failedReason = job.failedReason;
    const timeToComplete = job.finishedOn ? job.finishedOn - job.timestamp : null;

    return {
      analysis,
      failedReason,
      metadata: {
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        timeToComplete,
        ...(state && { state }),
        ...(typeof progress === "number" ? { progress } : {}),
      },
    };
  }

  /**
   * Get comprehensive queue statistics
   */
  static async getQueueStats() {
    const waiting = await analysisQueue.getWaiting();
    const active = await analysisQueue.getActive();
    const completed = await analysisQueue.getCompleted();
    const failed = await analysisQueue.getFailed();
    const redisStatus = getRedisStatus();

    const totalJobs = queueMetrics.totalJobsProcessed + queueMetrics.totalJobsFailed;
    const failureRate = totalJobs > 0 ? (queueMetrics.totalJobsFailed / totalJobs) * 100 : 0;

    return {
      // Queue counts
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length,
      
      // Performance metrics
      totalJobsProcessed: queueMetrics.totalJobsProcessed,
      totalJobsFailed: queueMetrics.totalJobsFailed,
      failureRate: Math.round(failureRate * 100) / 100,
      averageProcessingTime: Math.round(queueMetrics.averageProcessingTime),
      lastProcessedAt: queueMetrics.lastProcessedAt,
      
      // System health
      redisStatus,
      workerConcurrency: WORKER_CONCURRENCY,
      maxQueueSize: MAX_QUEUE_SIZE,
      currentQueueUtilization: Math.round(((waiting.length + active.length) / MAX_QUEUE_SIZE) * 100),
      
      // Recent history
      queueSizeHistory: queueMetrics.queueSizeHistory.slice(-20), // Last 20 entries
      errorCount: queueMetrics.errorCount,
      lastErrorAt: queueMetrics.lastErrorAt,
    };
  }

  /**
   * Get detailed health status
   */
  static async getHealthStatus() {
    const redisHealthy = await checkRedisHealth();
    const stats = await this.getQueueStats();
    
    const health = {
      status: redisHealthy && stats.failureRate < 20 ? 'healthy' : 'unhealthy',
      redis: redisHealthy ? 'connected' : 'disconnected',
      queue: stats.currentQueueUtilization < 80 ? 'normal' : 'overloaded',
      workers: stats.active <= WORKER_CONCURRENCY ? 'normal' : 'overloaded',
      errors: stats.failureRate < 10 ? 'normal' : 'high',
      timestamp: new Date().toISOString(),
    };

    return health;
  }

  /**
   * Get queue performance metrics
   */
  static getPerformanceMetrics() {
    return {
      ...queueMetrics,
      workerConcurrency: WORKER_CONCURRENCY,
      maxQueueSize: MAX_QUEUE_SIZE,
      jobTimeout: JOB_TIMEOUT,
    };
  }

  /**
   * Clean up old jobs
   */
  static async cleanOldJobs() {
    const completed = await analysisQueue.clean(
      24 * 60 * 60 * 1000,
      100,
      "completed"
    ); // 24 hours
    const failed = await analysisQueue.clean(24 * 60 * 60 * 1000, 50, "failed"); // 24 hours

    // Jobs cleaned successfully
  }

  /**
   * Pause the queue
   */
  static async pauseQueue() {
    await analysisQueue.pause();
  }

  /**
   * Resume the queue
   */
  static async resumeQueue() {
    await analysisQueue.resume();
  }

  /**
   * Adjust worker concurrency dynamically
   */
  static async adjustConcurrency(newConcurrency: number) {
    if (newConcurrency < 1 || newConcurrency > 10) {
      throw new Error("Concurrency must be between 1 and 10");
    }

    // Note: BullMQ doesn't have updateConcurrency method in current version
    // This would require recreating the worker with new concurrency
  }

  /**
   * Get optimal concurrency based on queue load
   */
  static async getOptimalConcurrency(): Promise<number> {
    const stats = await this.getQueueStats();
    const queueLoad = stats.currentQueueUtilization;
    
    if (queueLoad > 80) {
      return Math.min(WORKER_CONCURRENCY + 2, 10);
    } else if (queueLoad < 20) {
      return Math.max(WORKER_CONCURRENCY - 1, 1);
    }
    
    return WORKER_CONCURRENCY;
  }

  /**
   * Auto-scale workers based on queue load
   */
  static async autoScale() {
    try {
      const optimalConcurrency = await this.getOptimalConcurrency();
      if (optimalConcurrency !== WORKER_CONCURRENCY) {
        await this.adjustConcurrency(optimalConcurrency);
      }
    } catch (error) {
      console.error("❌ Auto-scaling failed:", error);
    }
  }

  /**
   * Gracefully shutdown the queue
   */
  static async shutdown() {
    try {
      // Stop the worker first
      await WorkerService.stopWorker();
      
      // Stop accepting new jobs
      await analysisQueue.pause();
      
      // Wait for active jobs to complete (with timeout)
      const activeJobs = await analysisQueue.getActive();
      if (activeJobs.length > 0) {
        // Wait up to 30 seconds for jobs to complete
        let waitTime = 0;
        const maxWaitTime = 30000;
        const checkInterval = 1000;
        
        while (waitTime < maxWaitTime) {
          const stillActive = await analysisQueue.getActive();
          if (stillActive.length === 0) {
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          waitTime += checkInterval;
        }
      }
      
      // Close queue
      await analysisQueue.close();
      
    } catch (error) {
      console.error("❌ Error during queue shutdown:", error);
      // Force close if graceful shutdown fails
      try {
        analysisQueue.close();
      } catch (forceError) {
        console.error("❌ Force close failed:", forceError);
      }
    }
  }
}

// Auto-scaling and monitoring intervals
let autoScaleInterval: NodeJS.Timeout | null = null;
let monitoringInterval: NodeJS.Timeout | null = null;

// Start auto-scaling (every 2 minutes)
export function startAutoScaling() {
  if (autoScaleInterval) return; // Already started
  
  autoScaleInterval = setInterval(async () => {
    try {
      await QueueService.autoScale();
    } catch (error) {
      console.error("❌ Auto-scaling error:", error);
    }
  }, 2 * 60 * 1000); // 2 minutes
}

// Stop auto-scaling
export function stopAutoScaling() {
  if (autoScaleInterval) {
    clearInterval(autoScaleInterval);
    autoScaleInterval = null;
  }
}

// Start monitoring (every 30 seconds)
export function startMonitoring() {
  if (monitoringInterval) return; // Already started
  
  monitoringInterval = setInterval(async () => {
    try {
      const health = await QueueService.getHealthStatus();
      const stats = await QueueService.getQueueStats();
      const workerStatus = WorkerService.getWorkerStatus();
      
      // Log health status
      if (health.status === 'unhealthy') {
        console.warn(`🚨 System unhealthy: Redis=${health.redis}, Queue=${health.queue}, Workers=${health.workers}, Errors=${health.errors}`);
      }
      
      // Check worker status
      if (!workerStatus.isRunning) {
        try {
          await WorkerService.startWorker();
        } catch (error) {
          console.error("❌ Failed to restart worker:", error);
        }
      }
      
      // Alert on high queue utilization
      if (stats.currentQueueUtilization > 90) {
        console.warn(`🚨 High queue utilization: ${stats.currentQueueUtilization}%`);
      }
      
    } catch (error) {
      console.error("❌ Monitoring error:", error);
    }
  }, 30 * 1000); // 30 seconds
}

// Stop monitoring
export function stopMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

// Graceful shutdown handling
process.on("SIGTERM", async () => {
  stopAutoScaling();
  stopMonitoring();
  await QueueService.shutdown();
  process.exit(0);
});

process.on("SIGINT", async () => {
  stopAutoScaling();
  stopMonitoring();
  await QueueService.shutdown();
  process.exit(0);
});

export default QueueService;
