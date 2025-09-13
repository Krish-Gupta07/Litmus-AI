import { Job } from "bullmq";
import type { AnalysisJobData, AnalysisJobResult } from "../types/queue.js";
import { JobStatus } from "../types/queue.js";
import { scrape } from "../services/scraper.js";
import { PrismaClient } from "@prisma/client";
import { transformQuery } from "../services/query-transform.js";
import { getFinalAnswer } from "../services/final-anwer.js";
import { qualityChecker } from "../services/qualityCheck.js";
import { runExa, extractSourceLinks, exaFilter } from "../services/exa.js";

const prisma = new PrismaClient();


// Import WhatsApp notification after the worker exists to avoid circular dependency
async function notifyWhatsAppUser(userId: string, result: any) {
  try {
    // Check if userId looks like a phone number (starts with + or digits)
    if (/^[\+\d]/.test(userId)) {
      const { WhatsAppHandler } = await import("../bots/whatsapp/handler.js");
      await WhatsAppHandler.handleJobResult(userId, result);
    }
  } catch (error) {
    console.error('Failed to notify WhatsApp user:', error);
  }
}

/**
 * Process an analysis job from the queue
 */
export async function processAnalysisJob(
  job: Job<AnalysisJobData>
): Promise<AnalysisJobResult> {
  const { userId, input, inputType, url, text, dbJobId } = job.data;
  const startTime = Date.now();

  // Set up job timeout
  const timeout = setTimeout(() => {
    console.warn(`⚠️ Job ${job.id} is taking longer than expected`);
  }, 4 * 60 * 1000); // 4 minutes warning

  try {
    // Update job status to RUNNING in database (use dbJobId, not queue job id)
    if (dbJobId) {
      await updateJobStatus(dbJobId, JobStatus.RUNNING);
    }
    await job.updateProgress(10);

    // Step 1: Scrape content if URL provided
    let scrapedText = "";
    if (inputType === "url" && url) {
      await job.updateProgress(20);

      const scrapedData = await scrape(url);
        if (scrapedData) {
        scrapedText = scrapedData.body;
      } else {
        throw new Error("Failed to scrape URL content");
      }
    } else if (inputType === "text" && text) {
      scrapedText = text;
    }

    await job.updateProgress(40);

    // Step 2: Transform query using AI
  // transform query

    const queryText = scrapedText || input;
    const transformResult = await transformQuery(queryText);

    if (!transformResult) {
      throw new Error("Failed to transform query");
    }

    await job.updateProgress(60);

    // Step 3: Get Exa search results for better context
    let exaContext: string[] = [];
    try {
      const exaResults = await runExa(transformResult);
      exaContext = exaFilter(exaResults);
    } catch (error) {
      console.error("Exa search failed:", error);
    }

    // Step 4: Get final answer using AI with context
    const finalAnswerResult = await getFinalAnswer(transformResult, exaContext); // Pass Exa context

    if (!finalAnswerResult) {
      throw new Error("Failed to generate final answer");
    }

    // finalAnswerResult received

    await job.updateProgress(90);

    // Step 4: Quality check and source extraction
    let finalResponse: string;
    let credibilityScore: number = 0;
    let sources: string[] | null = null;

    if ("payload" in finalAnswerResult && finalAnswerResult.payload) {
      finalResponse = finalAnswerResult.payload.description;
      
      // Run quality check using existing service
      const qualityCheck = await qualityChecker(finalResponse, transformResult);
      if ("sufficiency_percentage" in qualityCheck) {
        credibilityScore = qualityCheck.sufficiency_percentage;
      }

      // Extract sources for both URL and text inputs to provide better context
      try {
        const exa = await runExa(transformResult);
        sources = extractSourceLinks(exa);
      } catch (error) {
        console.error("Exa search failed:", error);
        sources = null;
      }
    } else {
      finalResponse = "No description available";
    }

    // Step 5: Prepare final result
    const result = {
      title: ("payload" in finalAnswerResult && finalAnswerResult.payload?.title) 
        ? finalAnswerResult.payload.title 
        : "Analysis Complete",
      description: finalResponse,
      credibilityScore,
      searchTopics: transformResult.searchTopics,
      ragQuestions: transformResult.ragQuestion,
      ...(sources && { sources })
    };

if (dbJobId) {
  await updateJobResult(dbJobId, result, scrapedText);
}
await job.updateProgress(100);

  // job completed successfully
  // Notify user if this is a WhatsApp job (userId looks like a phone number)
  await notifyWhatsAppUser(userId, {
    success: true,
    data: result
  });

    // Clear timeout on successful completion
    clearTimeout(timeout);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Job ${job.id} completed in ${processingTime}ms`);

    return {
      jobId: parseInt(job.id as string),
      status: "completed",
      result,
      scrapedText,
    };
  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeout);
    
    const processingTime = Date.now() - startTime;
    console.error(`Job ${job.id} (DB: ${dbJobId}) failed after ${processingTime}ms:`, error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Update job status to FAILED in database (use dbJobId)
    if (dbJobId) {
      await updateJobStatus(dbJobId, JobStatus.FAILED, errorMessage);
    }
    
    // Notify user if this is a WhatsApp job (userId looks like a phone number)
    await notifyWhatsAppUser(userId, {
      success: false,
      error: errorMessage
    });

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
