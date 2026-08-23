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
  
  let msg = '';
  let mediaUrl: string[] | undefined = undefined;

  if (j.name === 'postCallWA') {
    msg = `Hello ${nm || 'there'}! It was great speaking with you. I noted your e-commerce requirements: budget of ${c.budget||'TBD'}, timeline of ${c.timeline||'TBD'}, and features like ${c.features||'TBD'}.\n\nI've attached our system architecture diagram and my resume for your reference.\n\nYou can reach me directly at ${env.MY_PHONE_NUMBER} if you have any questions!`;
    mediaUrl = [];
    if (env.ARCHITECTURE_IMAGE_URL) mediaUrl.push(env.ARCHITECTURE_IMAGE_URL);
    if (env.RESUME_URL) mediaUrl.push(env.RESUME_URL);
    if (mediaUrl.length === 0) mediaUrl = undefined;
  } else {
    msg = `Hi ${nm || 'there'}. High intent detected. Budget: ${c.budget||'-'}. Timeline: ${c.timeline||'-'}. Features: ${c.features||'-'}. Contact: ${env.MY_PHONE_NUMBER}`;
  }
  
  if (!twl) {
    log.info(`Sim WA: ${msg} [Media: ${mediaUrl?.join(', ')}]`);
    await db.whatsappMessage.create({ data: { leadId: lId, content: msg, status: 'SIM' } });
    return;
  }
  try {
    const payload: any = { from: env.TWILIO_WHATSAPP_NUMBER, to: `whatsapp:${ph}`, body: msg };
    if (mediaUrl) payload.mediaUrl = mediaUrl;
    
    await twl.messages.create(payload);
    await db.whatsappMessage.create({ data: { leadId: lId, content: msg, status: 'SENT' } });
  } catch (e) {
    log.error(e as Error, 'WA fail');
    await db.whatsappMessage.create({ data: { leadId: lId, content: msg, status: 'FAIL' } });
    throw e;
  }
}, { connection: r });

waWk.on('completed', j => log.info(`WA ${j.id} ok`));
waWk.on('failed', (j, e) => log.error(`WA ${j?.id} fail: ${e.message}`));
