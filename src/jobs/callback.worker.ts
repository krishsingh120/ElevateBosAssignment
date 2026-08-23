import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { env } from '../config/env';
import { log } from '../utils/logger';
import { db } from '../db/client';

const r = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const cbWk = new Worker('cb', async (j) => {
  const { leadId: lId, cbId, phone: ph } = j.data;
  await db.callback.update({ where: { id: cbId }, data: { status: 'COMPLETED' } });
  log.info(`Sim cb to ${ph}`);
}, { connection: r });

cbWk.on('completed', j => log.info(`CB ${j.id} ok`));
cbWk.on('failed', (j, e) => log.error(`CB ${j?.id} fail: ${e.message}`));
