// export interface AnalysisResponse {
//   analysis: {
//     jobId: number;
//     status: 'pending' | 'running' | 'completed' | 'failed';
//     result: {
//       title: string;
//       description: string;
//       credibilityScore?: number;
//       searchTopics: {
//         entities: string[];
//         concepts: string[];
//         claims: string[];
//       };
//       ragQuestions: string;
//     };
//     scrapedText?: string;
//   };
//   failedReason?: string;
//   metadata: {
//     timestamp?: number;
//     processedOn?: number;
//     finishedOn?: number;
//     timeToComplete?: number;
//   };
// }

export interface AnalysisApiResponse {
  success: boolean;
  data: {
    analysis: {
      jobId: number;
      status: 'pending' | 'running' | 'completed' | 'failed';
      result: {
        title: string;
        description: string;
        credibilityScore: number;
        searchTopics: {
          entities: string[];
          concepts: string[];
          claims: string[];
        };
        ragQuestions: string;
        sources?: string[];
      };
      scrapedText?: string;
    };
    metadata: {
      timestamp: number;
      processedOn: number;
      finishedOn: number;
      timeToComplete: number;
      state: string;
      progress: number;
    };
  };
}

export interface AnalysisData {
  jobId: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: {
    title: string;
    description: string;
    credibilityScore?: number;
    searchTopics: {
      entities: string[];
      concepts: string[];
      claims: string[];
    };
    ragQuestions: string;
  };
  scrapedText?: string;
  failedReason?: string;
}

export interface AnalysisMetadata {
  timestamp?: number;
  processedOn?: number;
  finishedOn?: number;
  timeToComplete?: number;
}

export interface Job {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  input: string;
  result: string;
  createdAt: string;
}

export interface JobsResponse {
  success: boolean;
  data: {
    jobs: Job[];
    total: number;
  };
}