export interface AnalysisJobData {
  userId: string;
  input: string;
  inputType: 'url' | 'text';
  url?: string;
  text?: string;
}

export interface AnalysisJobResult {
  jobId: number;
  status: 'completed' | 'failed';
  result?: {
    title: string;
    description: string;
    searchTopics: {
      entities: string[];
      concepts: string[];
      claims: string[];
    };
    ragQuestions: string[];
  };
  error?: string;
  scrapedText?: string;
}

export interface QueueJobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
}

export enum JobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface JobProgress {
  jobId: number;
  status: JobStatus;
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining?: number; // in seconds
}
