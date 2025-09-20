// Test the worker function directly
import { processAnalysisJob } from './dist/workers/analysis.worker.js';

// Mock job object
const mockJob = {
  id: 'test-123',
  data: {
    userId: 'test-user-123',
    input: 'Test input',
    inputType: 'text',
    text: 'Test input',
    dbJobId: 'test-db-123'
  },
  updateProgress: (progress) => {
    console.log(`Progress: ${progress}%`);
  }
};

console.log('🧪 Testing worker function directly...');

processAnalysisJob(mockJob)
  .then(result => {
    console.log('✅ Worker function completed:', result);
  })
  .catch(error => {
    console.error('❌ Worker function failed:', error);
  });
