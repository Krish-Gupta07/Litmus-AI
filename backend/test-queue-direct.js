import { QueueService } from './dist/services/queue.js';
import { processAnalysisJob } from './dist/workers/analysis.worker.js';

async function testQueueDirect() {
  console.log('🧪 Testing queue directly...');
  
  try {
    // Add a job directly to the queue
    const job = await QueueService.addJob({
      userId: 'test-user-123',
      input: 'Direct test query for queue',
      inputType: 'text',
      text: 'Direct test query for queue',
      dbJobId: 'test-db-id-123'
    });
    
    console.log('✅ Job added to queue:', job.id);
    
    // Wait a bit for processing
    console.log('⏳ Waiting for job to be processed...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check job status
    const status = await QueueService.getJobStatus(job.id);
    console.log('📊 Job status:', status);
    
    // Check queue stats
    const stats = await QueueService.getQueueStats();
    console.log('📈 Queue stats:', stats);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testQueueDirect();
