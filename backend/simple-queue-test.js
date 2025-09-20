import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';

// Create Redis connection
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: 3,
});

const QUEUE_NAME = 'analysis-queue';

// Create queue
const testQueue = new Queue(QUEUE_NAME, {
  connection: redis,
});

// Create worker
const testWorker = new Worker(QUEUE_NAME, async (job) => {
  console.log(`🔄 Processing job ${job.id}:`, job.data);
  
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(`✅ Job ${job.id} completed`);
  return { success: true, result: 'Test completed' };
}, {
  connection: redis,
  concurrency: 1,
});

// Test the queue
async function testQueue() {
  console.log('🧪 Testing simple queue...');
  
  try {
    // Wait for worker to be ready
    await new Promise(resolve => {
      testWorker.on('ready', resolve);
    });
    
    console.log('✅ Worker is ready');
    
    // Add a job
    const job = await testQueue.add('test-job', {
      userId: 'test-user-123',
      input: 'Simple test query',
      inputType: 'text'
    });
    
    console.log('✅ Job added:', job.id);
    
    // Wait for processing
    console.log('⏳ Waiting for job to be processed...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check job status
    const jobStatus = await job.getState();
    console.log('📊 Job status:', jobStatus);
    
    // Get job result
    const result = await job.getReturnvalue();
    console.log('📋 Job result:', result);
    
    // Clean up
    await testWorker.close();
    await testQueue.close();
    await redis.quit();
    
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testQueue();
