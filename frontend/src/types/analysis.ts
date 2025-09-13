export interface AnalysisResponse {
  status: number;
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
      };
      scrapedText: string;
    };
    metadata: {
      timestamp: number;
      processedOn: number;
      finishedOn: number;
      timeToComplete: number;
    };
  };
}

export interface AnalysisData {
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
  };
  scrapedText: string;
}

export interface AnalysisMetadata {
  timestamp: number;
  processedOn: number;
  finishedOn: number;
  timeToComplete: number;
}
