import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { prisma } from '../db/client';

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const callbackWorker = new Worker('callback', async (job: Job) => {
  const { leadId, callbackId, phoneNumber } = job.data;
  logger.info({ leadId, callbackId, phoneNumber }, 'Executing scheduled callback job');

  // Mark callback as completed
  await prisma.callback.update({
    where: { id: callbackId },
    data: { status: 'COMPLETED' }
  });

  // Here we would use the voiceService to place the outbound call again.
  // For now, we simulate this to avoid real recursive calling without user intervention.
  logger.info(`Simulated automated callback being placed to ${phoneNumber}`);

}, { connection });

callbackWorker.on('completed', (job) => {
  logger.info(`Callback job ${job.id} completed successfully`);
});

callbackWorker.on('failed', (job, err) => {
  logger.error(`Callback job ${job?.id} failed with error ${err.message}`);
});
