import { Worker } from 'bullmq';
import Redis from 'ioredis';
import twilio from 'twilio';
import { env } from '../config/env';
import { log } from '../utils/logger';
import { db } from '../db/client';

const r = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
const twl = env.TWILIO_ACCOUNT_SID && env.WHATSAPP_TOKEN !== 'dummy_twilio_token' ? twilio(env.TWILIO_ACCOUNT_SID, env.WHATSAPP_TOKEN) : null;

export const waWk = new Worker('wa', async (j) => {
  const { leadId: lId, phone: ph, name: nm, ctx: c } = j.data;
  const msg = `Hi ${nm || 'there'}. Budget: ${c.budget||'-'}. Timeline: ${c.timeline||'-'}. Features: ${c.features||'-'}. Contact: ${env.MY_PHONE_NUMBER}`;
  
  if (!twl) {
    log.info(`Sim WA: ${msg}`);
    await db.whatsappMessage.create({ data: { leadId: lId, content: msg, status: 'SIM' } });
    return;
  }
  try {
    await twl.messages.create({ from: env.TWILIO_WHATSAPP_NUMBER, to: `whatsapp:${ph}`, body: msg });
    await db.whatsappMessage.create({ data: { leadId: lId, content: msg, status: 'SENT' } });
  } catch (e) {
    log.error(e as Error, 'WA fail');
    await db.whatsappMessage.create({ data: { leadId: lId, content: msg, status: 'FAIL' } });
    throw e;
  }
}, { connection: r });

waWk.on('completed', j => log.info(`WA ${j.id} ok`));
waWk.on('failed', (j, e) => log.error(`WA ${j?.id} fail: ${e.message}`));
