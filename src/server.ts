import { buildApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const start = async () => {
  const app = buildApp();
  try {
    const port = parseInt(env.PORT, 10);
    await app.listen({ port, host: '0.0.0.0' });
    logger.info(`Server successfully started on port ${port} in ${env.NODE_ENV} mode`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();
