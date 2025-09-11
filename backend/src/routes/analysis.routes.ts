import express from 'express';
import { z } from 'zod';
import type { Request, Response } from 'express';
import { QueueService } from '../services/queue.js';
import { createAnalysisJob } from '../workers/analysis.worker.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const analyzeRequestSchema = z.object({
  url: z.string().url().optional(),
  text: z.string().min(1).optional(),
  userId: z.string().min(1),
});

const jobStatusSchema = z.object({
  jobId: z.string(),
});

/**
 * POST /api/analysis/analyze
 * Submit a new analysis job
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = analyzeRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.errors,
      });
    }

    const { url, text, userId } = validationResult.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Determine input type and content
    const inputType = url ? 'url' : 'text';
    const input = url || text || '';

    // Create job in database
    const dbJobId = await createAnalysisJob(userId, input, inputType);

    // Add job to queue
    const queueJob = await QueueService.addJob({
      userId,
      input,
      inputType,
      ...(url && { url }),
      ...(text && { text }),
    });

    console.log(`📝 Created analysis job: DB ID ${dbJobId}, Queue ID ${queueJob.id}`);

    return res.status(202).json({
      success: true,
      data: {
        jobId: queueJob.id,
        dbJobId,
        status: 'pending',
        message: 'Analysis job queued successfully',
        estimatedTime: '30-60 seconds',
      },
    });

  } catch (error) {
    console.error('Error creating analysis job:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create analysis job',
    });
  }
});

/**
 * GET /api/analysis/status/:jobId
 * Get job status and progress
 */
router.get('/status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    
    // Validate job ID
    const validationResult = jobStatusSchema.safeParse({ jobId });
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID',
      });
    }

    // Get job status from queue
    const queueStatus = await QueueService.getJobStatus(jobId!);
    
    if (queueStatus.error) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // Get job details from database
    const dbJob = await prisma.analysisJob.findFirst({
      where: { id: jobId! },
      select: {
        id: true,
        status: true,
        result: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        jobId,
        queueStatus,
        dbJob,
        progress: queueStatus.progress || 0,
        currentStep: getCurrentStep(queueStatus.state, queueStatus.progress),
      },
    });

  } catch (error) {
    console.error('Error getting job status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get job status',
    });
  }
});

/**
 * GET /api/analysis/jobs/:userId
 * Get all jobs for a user
 */
router.get('/jobs/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
      });
    }

    const jobs = await prisma.analysisJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        input: true,
        result: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        jobs,
        total: jobs.length,
      },
    });

  } catch (error) {
    console.error('Error getting user jobs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get user jobs',
    });
  }
});

/**
 * GET /api/analysis/queue/stats
 * Get queue statistics
 */
router.get('/queue/stats', async (req: Request, res: Response) => {
  try {
    const stats = await QueueService.getQueueStats();
    
    return res.status(200).json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('Error getting queue stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get queue statistics',
    });
  }
});

/**
 * POST /api/analysis/queue/clean
 * Clean old jobs from queue
 */
router.post('/queue/clean', async (req: Request, res: Response) => {
  try {
    await QueueService.cleanOldJobs();
    
    return res.status(200).json({
      success: true,
      message: 'Queue cleaned successfully',
    });

  } catch (error) {
    console.error('Error cleaning queue:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to clean queue',
    });
  }
});

/**
 * Helper function to get current step description
 */
function getCurrentStep(state: string, progress: number): string {
  switch (state) {
    case 'waiting':
      return 'Waiting in queue';
    case 'active':
      if (progress < 20) return 'Initializing job';
      if (progress < 40) return 'Scraping content';
      if (progress < 60) return 'Transforming query';
      if (progress < 80) return 'Generating answer';
      return 'Finalizing results';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    default:
      return 'Unknown';
  }
}

export default router;
