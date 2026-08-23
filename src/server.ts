import { buildApp } from './app';
import { env } from './config/env';
import { connectDB } from './db/client';
import { log } from './utils/logger';

async function start() {
  try {
    await connectDB();
    const app = buildApp();
    const port = parseInt(env.PORT || '3000', 10);
    await app.listen({ port, host: '0.0.0.0' });
    log.info(`App at http://localhost:${port}`);
  } catch (e) {
    log.error(e);
    process.exit(1);
  }
}
start();
