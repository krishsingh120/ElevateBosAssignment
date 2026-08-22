import Fastify from 'fastify';
import { env } from './config/env';
import { logger } from './utils/logger';

export function buildApp() {
  const app = Fastify({
    logger: logger as any,
  });

  app.get('/health', async (request, reply) => {
    return { 
      status: 'ok', 
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString()
    };
  });

  return app;
}
