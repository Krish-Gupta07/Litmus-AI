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
const JOB_TIMEOUT = parseInt(process.env.JOB_TIMEOUT || "300000");
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
    removeOnComplete: 100,
    removeOnFail: 50,
    delay: 0,
  },
});

let integratedWorker: Worker<AnalysisJobData> | null = null;
let autoResumeInterval: NodeJS.Timeout | null = null;

export class WorkerService {
  static async startWorker(): Promise<void> {
    if (integratedWorker) {
      console.log("✅ Worker is already running");
      return;
    }

    try {
      console.log("🚀 Starting integrated worker...");

      integratedWorker = new Worker<AnalysisJobData>(
        QUEUE_NAME,
        async (job) => {
          console.log(`🚀 Integrated worker processing job ${job.id}`);
          try {
            const result = await processAnalysisJob(job);
            console.log(`✅ Job ${job.id} completed successfully`);
            return result;
          } catch (error) {
            console.error(`❌ Job ${job.id} failed:`, error);
            throw error;
          }
        },
        {
          connection: redis,
          concurrency: WORKER_CONCURRENCY,
        }
      );

      integratedWorker.on("ready", () => {
        console.log("✅ Integrated worker is ready to process jobs");
      });

      integratedWorker.on("active", (job) => {
        console.log(`🔄 Processing job ${job.id}`);
      });

      integratedWorker.on("completed", (job) => {
        console.log(`✅ Job ${job.id} completed`);
        queueMetrics.totalJobsProcessed++;
        queueMetrics.lastProcessedAt = Date.now();
      });

      integratedWorker.on("failed", (job, err) => {
        console.error(`❌ Job ${job?.id} failed:`, err.message);
        queueMetrics.totalJobsFailed++;
        queueMetrics.errorCount++;
        queueMetrics.lastErrorAt = Date.now();
      });

      integratedWorker.on("error", (error) => {
        console.error("❌ Integrated worker error:", error);
      });

      this.startAutoResume();

      console.log("✅ Integrated worker started successfully");
    } catch (error) {
      console.error("❌ Failed to start integrated worker:", error);
      throw error;
    }
  }

  static async stopWorker(): Promise<void> {
    if (!integratedWorker) {
      console.log("ℹ️ Worker is not running");
      return;
    }

    try {
      console.log("🔄 Stopping integrated worker...");

      this.stopAutoResume();

      await integratedWorker.close();
      integratedWorker = null;

      console.log("✅ Integrated worker stopped successfully");
    } catch (error) {
      console.error("❌ Failed to stop integrated worker:", error);
      throw error;
    }
  }

  static isWorkerRunning(): boolean {
    return integratedWorker !== null;
  }

  static getWorkerStatus() {
    return {
      isRunning: this.isWorkerRunning(),
      concurrency: WORKER_CONCURRENCY,
      queueName: QUEUE_NAME,
      autoResumeActive: autoResumeInterval !== null,
    };
  }

  static startAutoResume(): void {
    if (autoResumeInterval) {
      return;
    }

    console.log("🔄 Starting auto-resume functionality...");

    autoResumeInterval = setInterval(async () => {
      try {
        const isPaused = await analysisQueue.isPaused();
        if (isPaused) {
          console.log("🔄 Queue is paused, attempting to resume...");
          await analysisQueue.resume();
          console.log("✅ Queue resumed successfully");
        }
      } catch (error) {
        console.error("❌ Error in auto-resume:", error);
      }
    }, 30000); // Check every 30 seconds

    console.log("✅ Auto-resume functionality started");
  }

  static stopAutoResume(): void {
    if (autoResumeInterval) {
      clearInterval(autoResumeInterval);
      autoResumeInterval = null;
      console.log("✅ Auto-resume functionality stopped");
    }
  }

  static async processWaitingJobs() {
    try {
      const waiting = await analysisQueue.getWaiting();

      if (waiting.length > 0) {
        // Ensure queue is resumed if there are waiting jobs
        const isPaused = await analysisQueue.isPaused();
        if (isPaused) {
          await analysisQueue.resume();
          console.log("✅ Queue resumed to process waiting jobs");
        }
        return waiting.length;
      }

      return 0;
    } catch (error) {
      console.error("Error processing waiting jobs:", error);
      return 0;
    }
  }
}
export class QueueService {
  static async addJob(
    jobData: AnalysisJobData,
    options: QueueJobOptions = {}
  ): Promise<Job<AnalysisJobData>> {
    const isRedisHealthy = await checkRedisHealth();
    if (!isRedisHealthy) {
      throw new Error(
        "Redis connection is not available. Please try again later."
      );
    }

    const waiting = await analysisQueue.getWaiting();
    const active = await analysisQueue.getActive();
    const currentQueueSize = waiting.length + active.length;

    if (currentQueueSize >= MAX_QUEUE_SIZE) {
      throw new Error(
        `Queue is full. Current size: ${currentQueueSize}/${MAX_QUEUE_SIZE}. Please try again later.`
      );
    }

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
    console.log(`Job added to queue with ID: ${job.id}`);

    // Update queue size history
    queueMetrics.queueSizeHistory.push(currentQueueSize + 1);
    if (queueMetrics.queueSizeHistory.length > 100) {
      queueMetrics.queueSizeHistory.shift();
    }

    return job as Job<AnalysisJobData>;
  }

  private static determineJobPriority(
    jobData: AnalysisJobData,
    userPriority?: number
  ): number {
    if (userPriority !== undefined) {
      return Math.max(1, Math.min(10, userPriority));
    }

    if (jobData.userId && /^[\+\d]/.test(jobData.userId)) {
      return PRIORITY_LEVELS.HIGH;
    }

    if (jobData.inputType === "url") {
      return PRIORITY_LEVELS.NORMAL;
    }

    return PRIORITY_LEVELS.LOW;
  }

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
    const timeToComplete = job.finishedOn
      ? job.finishedOn - job.timestamp
      : null;

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

  static async getQueueStats() {
    const waiting = await analysisQueue.getWaiting();
    const active = await analysisQueue.getActive();
    const completed = await analysisQueue.getCompleted();
    const failed = await analysisQueue.getFailed();
    const redisStatus = getRedisStatus();

    const totalJobs =
      queueMetrics.totalJobsProcessed + queueMetrics.totalJobsFailed;
    const failureRate =
      totalJobs > 0 ? (queueMetrics.totalJobsFailed / totalJobs) * 100 : 0;

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length,

      totalJobsProcessed: queueMetrics.totalJobsProcessed,
      totalJobsFailed: queueMetrics.totalJobsFailed,
      failureRate: Math.round(failureRate * 100) / 100,
      averageProcessingTime: Math.round(queueMetrics.averageProcessingTime),
      lastProcessedAt: queueMetrics.lastProcessedAt,

      redisStatus,
      workerConcurrency: WORKER_CONCURRENCY,
      maxQueueSize: MAX_QUEUE_SIZE,
      currentQueueUtilization: Math.round(
        ((waiting.length + active.length) / MAX_QUEUE_SIZE) * 100
      ),

      queueSizeHistory: queueMetrics.queueSizeHistory.slice(-20),
      errorCount: queueMetrics.errorCount,
      lastErrorAt: queueMetrics.lastErrorAt,
    };
  }

  static async getHealthStatus() {
    const redisHealthy = await checkRedisHealth();
    const stats = await this.getQueueStats();

    const health = {
      status: redisHealthy && stats.failureRate < 20 ? "healthy" : "unhealthy",
      redis: redisHealthy ? "connected" : "disconnected",
      queue: stats.currentQueueUtilization < 80 ? "normal" : "overloaded",
      workers: stats.active <= WORKER_CONCURRENCY ? "normal" : "overloaded",
      errors: stats.failureRate < 10 ? "normal" : "high",
      timestamp: new Date().toISOString(),
    };

    return health;
  }

  static getPerformanceMetrics() {
    return {
      ...queueMetrics,
      workerConcurrency: WORKER_CONCURRENCY,
      maxQueueSize: MAX_QUEUE_SIZE,
      jobTimeout: JOB_TIMEOUT,
    };
  }

  static async cleanOldJobs() {
    const completed = await analysisQueue.clean(
      24 * 60 * 60 * 1000,
      100,
      "completed"
    );
    const failed = await analysisQueue.clean(24 * 60 * 60 * 1000, 50, "failed");
  }

  static async pauseQueue() {
    await analysisQueue.pause();
  }

  static async resumeQueue() {
    await analysisQueue.resume();
  }

  static async adjustConcurrency(newConcurrency: number) {
    if (newConcurrency < 1 || newConcurrency > 10) {
      throw new Error("Concurrency must be between 1 and 10");
    }
  }

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

  static async shutdown() {
    try {
      await WorkerService.stopWorker();

      await analysisQueue.pause();

      const activeJobs = await analysisQueue.getActive();
      if (activeJobs.length > 0) {
        let waitTime = 0;
        const maxWaitTime = 30000;
        const checkInterval = 1000;

        while (waitTime < maxWaitTime) {
          const stillActive = await analysisQueue.getActive();
          if (stillActive.length === 0) {
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, checkInterval));
          waitTime += checkInterval;
        }
      }

      await analysisQueue.close();
    } catch (error) {
      console.error("Error during queue shutdown:", error);
      try {
        analysisQueue.close();
      } catch (forceError) {
        console.error("Force close failed:", forceError);
      }
    }
  }
}

let autoScaleInterval: NodeJS.Timeout | null = null;
let monitoringInterval: NodeJS.Timeout | null = null;

export function startAutoScaling() {
  if (autoScaleInterval) return;

  autoScaleInterval = setInterval(async () => {
    try {
      await QueueService.autoScale();
    } catch (error) {
      console.error("Auto-scaling error:", error);
    }
  }, 2 * 60 * 1000);
}

export function stopAutoScaling() {
  if (autoScaleInterval) {
    clearInterval(autoScaleInterval);
    autoScaleInterval = null;
  }
}

export function startMonitoring() {
  if (monitoringInterval) return;

  monitoringInterval = setInterval(async () => {
    try {
      const health = await QueueService.getHealthStatus();
      const stats = await QueueService.getQueueStats();
      const workerStatus = WorkerService.getWorkerStatus();

      if (health.status === "unhealthy") {
        console.warn(
          `🚨 System unhealthy: Redis=${health.redis}, Queue=${health.queue}, Workers=${health.workers}, Errors=${health.errors}`
        );
      }

      if (!workerStatus.isRunning) {
        try {
          await WorkerService.startWorker();
        } catch (error) {
          console.error("❌ Failed to restart worker:", error);
        }
      }

      if (stats.currentQueueUtilization > 90) {
        console.warn(
          `🚨 High queue utilization: ${stats.currentQueueUtilization}%`
        );
      }
    } catch (error) {
      console.error("❌ Monitoring error:", error);
    }
  }, 30 * 1000);
}

export function stopMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

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
