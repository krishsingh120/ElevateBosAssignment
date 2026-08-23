import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

connection.on('error', (err) => {
  logger.warn(err as Error, 'Redis connection failed (expected in DEMO mode if no Redis available)');
});

export const whatsappQueue = new Queue('whatsapp', { connection });
export const callbackQueue = new Queue('callback', { connection });

logger.info('BullMQ Queues initialized');
