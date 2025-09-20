import "dotenv/config";
import { Worker } from "bullmq";
import { redis } from "./lib/redis.js";
import { processAnalysisJob } from "./workers/analysis.worker.js";
import { QUEUE_NAME } from "./services/queue.js";

// Initialize worker
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    console.log(`🚀 Worker processing job ${job.id} with data:`, job.data);
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
    concurrency: 1,
  }
);

// Worker event handlers
worker.on("ready", () => {
  console.log("✅ Worker is ready to process jobs");
});

worker.on("active", (job) => {
  console.log(`🔄 Processing job ${job.id}`);
});

worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

worker.on("error", (error) => {
  console.error("❌ Worker error:", error);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🔄 Shutting down worker...");
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🔄 Shutting down worker...");
  await worker.close();
  process.exit(0);
});

console.log("🚀 Worker started and ready to process jobs");
