import Fastify from 'fastify';
import { env } from './config/env';
import { logger } from './utils/logger';
import { voiceService } from './services/voice.service';
import { handleVapiWebhook } from './webhooks/vapi.webhook';

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

  app.post('/api/calls/outbound', async (request: any, reply) => {
    const { phoneNumber } = request.body;
    
    if (!phoneNumber) {
      return reply.status(400).send({ error: 'phoneNumber is required' });
    }

    const callId = await voiceService.initiateOutboundCall(phoneNumber);

    if (callId) {
      return reply.status(200).send({ callId, status: 'initiated' });
    } else {
      return reply.status(500).send({ error: 'Failed to initiate call' });
    }
  });

  app.post('/api/webhooks/vapi', async (request, reply) => {
    return handleVapiWebhook(request, reply);
  });

  return app;
}
