import { Job } from "bullmq";
import type { AnalysisJobData, AnalysisJobResult } from "../types/queue.js";
import { scrape } from "../services/scraper.js";
import { PrismaClient, JobStatus } from "@prisma/client";
import { transformQuery } from "../services/query-transform.js";
import { getFinalAnswer } from "../services/final-anwer.js";
import { qualityChecker } from "../services/qualityCheck.js";
import { runExa, extractSourceLinks, exaFilter } from "../services/exa.js";

const prisma = new PrismaClient();

async function notifyWhatsAppUser(userId: string, result: any) {
  try {
    if (/^[\+\d]/.test(userId)) {
      const { WhatsAppHandler } = await import("../bots/whatsapp/handler.js");
      await WhatsAppHandler.handleJobResult(userId, result);
    }
  } catch (error) {
    console.error("Failed to notify WhatsApp user:", error);
  }
}

export async function processAnalysisJob(
  job: Job<AnalysisJobData>
): Promise<AnalysisJobResult> {
  console.log(`🚀 Starting to process job ${job.id} with data:`, job.data);
  const { userId, input, inputType, url, text, dbJobId } = job.data;
  const startTime = Date.now();

  const timeout = setTimeout(() => {}, 4 * 60 * 1000);

  try {
    if (dbJobId) {
      await updateJobStatus(dbJobId, JobStatus.RUNNING);
    }
    await job.updateProgress(10);

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

    const queryText = scrapedText || input;
    const transformResult = await transformQuery(queryText);

    if (!transformResult) {
      throw new Error("Failed to transform query");
    }

    await job.updateProgress(60);

    let exaContext: string[] = [];
    try {
      const exaResults = await runExa(transformResult);
      exaContext = exaFilter(exaResults);
    } catch (error) {
      console.error("Exa search failed:", error);
    }

    const finalAnswerResult = await getFinalAnswer(transformResult, exaContext);

    if (!finalAnswerResult) {
      throw new Error("Failed to generate final answer");
    }

    await job.updateProgress(90);

    let finalResponse: string;
    let credibilityScore: number = 0;
    let sources: string[] | null = null;

    if ("payload" in finalAnswerResult && finalAnswerResult.payload) {
      finalResponse = finalAnswerResult.payload.description;

      const qualityCheck = await qualityChecker(finalResponse, transformResult);
      if ("sufficiency_percentage" in qualityCheck) {
        credibilityScore = qualityCheck.sufficiency_percentage;
      }

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

    const result = {
      title:
        "payload" in finalAnswerResult && finalAnswerResult.payload?.title
          ? finalAnswerResult.payload.title
          : "Analysis Complete",
      description: finalResponse,
      credibilityScore,
      searchTopics: transformResult.searchTopics,
      ragQuestions: transformResult.ragQuestion,
      ...(sources && { sources }),
    };

    if (dbJobId) {
      await updateJobResult(dbJobId, result, scrapedText);
    }
    await job.updateProgress(100);

    await notifyWhatsAppUser(userId, {
      success: true,
      data: result,
    });

    clearTimeout(timeout);

    const processingTime = Date.now() - startTime;

    return {
      jobId: parseInt(job.id as string),
      status: "completed",
      result,
      scrapedText,
    };
  } catch (error) {
    clearTimeout(timeout);

    const processingTime = Date.now() - startTime;

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    if (dbJobId) {
      await updateJobStatus(dbJobId, JobStatus.FAILED, errorMessage);
    }

    await notifyWhatsAppUser(userId, {
      success: false,
      error: errorMessage,
    });

    return {
      jobId: parseInt(job.id as string),
      status: "failed",
      error: errorMessage,
    };
  }
}

async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  error?: string
) {
  try {
    const existingJob = await prisma.analysisJob.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      return;
    }

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

async function updateJobResult(
  jobId: string,
  result: any,
  scrapedText?: string
) {
  try {
    const existingJob = await prisma.analysisJob.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      return;
    }

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
