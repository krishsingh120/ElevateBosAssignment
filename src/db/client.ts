import { PrismaClient } from '@prisma/client';
import { log } from '../utils/logger';
export const db = new PrismaClient();
export async function connectDB() {
  try {
    await db.$connect();
    log.info('DB ok');
  } catch (e) {
    log.error(e as Error, 'DB fail');
    process.exit(1);
  }
}
