import { Redis, type RedisOptions } from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Circuit breaker state
let circuitBreakerState = {
  isOpen: false,
  failureCount: 0,
  lastFailureTime: 0,
  threshold: 5, // Open circuit after 5 failures
  timeout: 60000, // 1 minute timeout
};

// Redis connection options with retry logic
const redisOptions: RedisOptions = {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  enableOfflineQueue: false,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// Create Redis connection
export const redis = new Redis(REDIS_URL, redisOptions);

// Connection health tracking
let connectionHealth = {
  isConnected: false,
  lastPing: 0,
  consecutiveFailures: 0,
};

// Health check function
export async function checkRedisHealth(): Promise<boolean> {
  try {
    if (circuitBreakerState.isOpen) {
      const now = Date.now();
      if (now - circuitBreakerState.lastFailureTime > circuitBreakerState.timeout) {
        // Reset circuit breaker
        circuitBreakerState.isOpen = false;
        circuitBreakerState.failureCount = 0;
        console.log('🔄 Circuit breaker reset - attempting reconnection');
      } else {
        return false;
      }
    }

    await redis.ping();
    connectionHealth.isConnected = true;
    connectionHealth.lastPing = Date.now();
    connectionHealth.consecutiveFailures = 0;
    circuitBreakerState.failureCount = 0;
    return true;
  } catch (error) {
    connectionHealth.isConnected = false;
    connectionHealth.consecutiveFailures++;
    circuitBreakerState.failureCount++;
    circuitBreakerState.lastFailureTime = Date.now();

    if (circuitBreakerState.failureCount >= circuitBreakerState.threshold) {
      circuitBreakerState.isOpen = true;
      console.error('🚨 Circuit breaker opened - Redis connection failed');
    }

    console.error('❌ Redis health check failed:', error);
    return false;
  }
}

// Periodic health check
setInterval(async () => {
  await checkRedisHealth();
}, 30000); // Check every 30 seconds

// Handle Redis connection events
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
  connectionHealth.isConnected = true;
  connectionHealth.consecutiveFailures = 0;
  circuitBreakerState.isOpen = false;
  circuitBreakerState.failureCount = 0;
});

redis.on('ready', () => {
  console.log('🚀 Redis ready to accept commands');
  connectionHealth.isConnected = true;
});

redis.on('error', (error: Error) => {
  console.error('❌ Redis connection error:', error);
  connectionHealth.isConnected = false;
  connectionHealth.consecutiveFailures++;
  
  // Update circuit breaker
  circuitBreakerState.failureCount++;
  circuitBreakerState.lastFailureTime = Date.now();
  
  if (circuitBreakerState.failureCount >= circuitBreakerState.threshold) {
    circuitBreakerState.isOpen = true;
    console.error('🚨 Circuit breaker opened due to Redis errors');
  }
});

redis.on('close', () => {
  console.log('🔌 Redis connection closed');
  connectionHealth.isConnected = false;
});

redis.on('reconnecting', (delay: number) => {
  console.log(`🔄 Redis reconnecting in ${delay}ms`);
});

redis.on('end', () => {
  console.log('🔚 Redis connection ended');
  connectionHealth.isConnected = false;
});

// Graceful shutdown
export async function closeRedisConnection(): Promise<void> {
  try {
    await redis.quit();
    console.log('✅ Redis connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing Redis connection:', error);
    redis.disconnect();
  }
}

// Get connection status
export function getRedisStatus() {
  return {
    isConnected: connectionHealth.isConnected,
    lastPing: connectionHealth.lastPing,
    consecutiveFailures: connectionHealth.consecutiveFailures,
    circuitBreakerOpen: circuitBreakerState.isOpen,
    failureCount: circuitBreakerState.failureCount,
  };
}

export default redis;
