export const apiEndPoints = {
  analysis: {
    analyze: '/api/analysis/analyze',
    status: (jobId: number) => `/api/analysis/status/${jobId}`,
    jobs: (userId: string) => `/api/analysis/jobs/${userId}`,
    queueStats: '/api/analysis/queue/stats',
    cleanQueue: '/api/analysis/queue/clean',
  },
};
