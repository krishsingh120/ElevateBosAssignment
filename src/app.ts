import Fastify from 'fastify';
import { env } from './config/env';
import { log } from './utils/logger';
import { vSvc } from './services/voice.service';
import { handleVapi } from './webhooks/vapi.webhook';

export function buildApp() {
  const app = Fastify({ logger: log as any });

  app.get('/health', async () => ({ status: 'ok', env: env.NODE_ENV, ts: new Date().toISOString() }));

  app.post('/api/calls/outbound', async (req: any, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).send({ err: 'req phone' });
    const cId = await vSvc.callOut(phone);
    return cId ? res.status(200).send({ cId, status: 'init' }) : res.status(500).send({ err: 'fail' });
  });

  app.post('/api/webhooks/vapi', async (req, res) => handleVapi(req, res));

  return app;
}
