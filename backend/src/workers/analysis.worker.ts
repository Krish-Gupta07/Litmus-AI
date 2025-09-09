import { Job } from "bullmq";
import type { AnalysisJobData, AnalysisJobResult } from "../types/queue.js";
import { JobStatus } from "../types/queue.js";
import { scrape } from "../services/scraper.js";
import { PrismaClient } from "@prisma/client";
import { transformQuery } from "../services/query-transform.js";
import { getFinalAnswer } from "../services/final-anwer.js";

const prisma = new PrismaClient();

/**
 * Process an analysis job from the queue
 */
export async function processAnalysisJob(
  job: Job<AnalysisJobData>
): Promise<AnalysisJobResult> {
  const { userId, input, inputType, url, text } = job.data;

  console.log(`🔄 Processing job ${job.id} for user ${userId}`);

  try {
    // Update job status to RUNNING in database
    await updateJobStatus(job.id as string, JobStatus.RUNNING);
    await job.updateProgress(10);

    // Step 1: Scrape content if URL provided
    let scrapedText = "";
    if (inputType === "url" && url) {
      console.log(`📄 Scraping URL: ${url}`);
      await job.updateProgress(20);

      const scrapedData = await scrape(url);
      if (scrapedData) {
        scrapedText = scrapedData.body;
        console.log(`✅ Scraped ${scrapedText.length} characters`);
      } else {
        throw new Error("Failed to scrape URL content");
      }
    } else if (inputType === "text" && text) {
      scrapedText = text;
    }

    await job.updateProgress(40);

    // Step 2: Transform query using AI
    console.log("🤖 Transforming query with AI");

    const queryText = scrapedText || input;
    const transformResult = await transformQuery(queryText);

    if (!transformResult) {
      throw new Error("Failed to transform query");
    }

    await job.updateProgress(60);

    // Step 3: Get final answer using AI
    console.log("🔍 Generating final answer");
    const finalAnswerResult = await getFinalAnswer(transformResult, []); // Empty context for now

    if (!finalAnswerResult) {
      throw new Error("Failed to generate final answer");
    }

    await job.updateProgress(90);

    // Step 4: Save results to database
    const result = {
      title: ("payload" in finalAnswerResult && finalAnswerResult.payload?.title) 
        ? finalAnswerResult.payload.title 
        : "Analysis Complete",
      description: ("payload" in finalAnswerResult && finalAnswerResult.payload?.description) 
        ? finalAnswerResult.payload.description 
        : "No description available",
      searchTopics: transformResult.searchTopics,
      ragQuestions: transformResult.ragQuestion,
    };

    await updateJobResult(job.id as string, result, scrapedText);
    await job.updateProgress(100);

    console.log(`✅ Job ${job.id} completed successfully`);

    return {
      jobId: parseInt(job.id as string),
      status: "completed",
      result,
      scrapedText,
    };
  } catch (error) {
    console.error(`❌ Job ${job.id} failed:`, error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Update job status to FAILED in database
    await updateJobStatus(job.id as string, JobStatus.FAILED, errorMessage);

    return {
      jobId: parseInt(job.id as string),
      status: "failed",
      error: errorMessage,
    };
  }
}

/**
 * Update job status in database
 */
async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  error?: string
) {
  try {
    await prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status,
        ...(error && { result: JSON.stringify({ error }) }),
      },
    });
  } catch (error) {
    console.error("Failed to update job status in database:", error);
  }
}

/**
 * Update job result in database
 */
async function updateJobResult(
  jobId: string,
  result: any,
  scrapedText?: string
) {
  try {
    await prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: JobStatus.COMPLETED,
        result: JSON.stringify(result),
        scrapedText: scrapedText || null,
      },
    });
  } catch (error) {
    console.error("Failed to update job result in database:", error);
  }
}

/**
 * Create a new analysis job in database
 */
export async function createAnalysisJob(
  userId: string,
  input: string,
  inputType: "url" | "text"
): Promise<string> {
  const job = await prisma.analysisJob.create({
    data: {
      userId,
      input,
      status: JobStatus.PENDING,
      result: "",
    },
  });

  return job.id;
}

export default processAnalysisJob;
