import { Queue, Worker, Job } from "bullmq";
import { redis } from "../lib/redis.js";
import type {
  AnalysisJobData,
  AnalysisJobResult,
  QueueJobOptions,
} from "../types/queue.js";
import { processAnalysisJob } from "../workers/analysis.worker.js";

// Queue configuration
const QUEUE_NAME = "analysis-queue";
const WORKER_CONCURRENCY = 2; // Number of concurrent jobs

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
  },
});

// Create worker to process jobs
export const analysisWorker = new Worker<AnalysisJobData>(
  QUEUE_NAME,
  processAnalysisJob,
  {
    connection: redis,
    concurrency: WORKER_CONCURRENCY,
    autorun: true, // Start processing immediately
  }
);

// Worker event handlers
analysisWorker.on("completed", (job: Job<AnalysisJobData>) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

analysisWorker.on(
  "failed",
  (job: Job<AnalysisJobData> | undefined, err: Error) => {
    console.error(`❌ Job ${job?.id || "unknown"} failed:`, err.message);
  }
);

analysisWorker.on("error", (err: Error) => {
  console.error("❌ Worker error:", err);
});

// Queue management functions
export class QueueService {
  /**
   * Add a new analysis job to the queue
   */
  static async addJob(
    jobData: AnalysisJobData,
    options: QueueJobOptions = {}
  ): Promise<Job<AnalysisJobData>> {
    const job = await analysisQueue.add("analysis", jobData, {
      priority: options.priority || 0,
      delay: options.delay || 0,
      attempts: options.attempts || 3,
      backoff: options.backoff || {
        type: "exponential",
        delay: 2000,
      },
    });

    console.log(`📝 Added job ${job.id} to queue`);
    return job;
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
    const result = await job.returnvalue;
    const failedReason = job.failedReason;

    return {
      jobId,
      state,
      progress,
      result,
      failedReason,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats() {
    const waiting = await analysisQueue.getWaiting();
    const active = await analysisQueue.getActive();
    const completed = await analysisQueue.getCompleted();
    const failed = await analysisQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length,
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

    console.log(
      `🧹 Cleaned ${completed.length} completed and ${failed.length} failed jobs`
    );
  }

  /**
   * Pause the queue
   */
  static async pauseQueue() {
    await analysisQueue.pause();
    console.log("⏸️ Queue paused");
  }

  /**
   * Resume the queue
   */
  static async resumeQueue() {
    await analysisQueue.resume();
    console.log("▶️ Queue resumed");
  }

  /**
   * Gracefully shutdown the queue
   */
  static async shutdown() {
    console.log("🔄 Shutting down queue...");
    await analysisWorker.close();
    await analysisQueue.close();
    console.log("✅ Queue shutdown complete");
  }
}

// Graceful shutdown handling
process.on("SIGTERM", async () => {
  await QueueService.shutdown();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await QueueService.shutdown();
  process.exit(0);
});

export default QueueService;
