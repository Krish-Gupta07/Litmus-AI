import { Queue } from "bullmq";
import { Redis } from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: 3,
});

const analysisQueue = new Queue("analysis", {
  connection: redis,
});

async function resumeQueue(): Promise<void> {
  try {
    console.log("🔄 Resuming analysis queue...");

    // Resume the queue
    await analysisQueue.resume();

    console.log("✅ Analysis queue resumed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error resuming queue:", error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  resumeQueue();
}

export { resumeQueue };
