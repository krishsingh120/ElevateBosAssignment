import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { env } from '../config/env';
import { log } from '../utils/logger';

const r = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
r.on('error', (e) => log.warn(e as Error, 'Redis err'));

export const waQ = new Queue('wa', { connection: r });
export const cbQ = new Queue('cb', { connection: r });
log.info('Qs init');
