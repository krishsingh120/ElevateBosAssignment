import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import twilio from 'twilio';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { prisma } from '../db/client';

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const twilioClient = env.TWILIO_ACCOUNT_SID && env.WHATSAPP_TOKEN !== 'dummy_twilio_token'
  ? twilio(env.TWILIO_ACCOUNT_SID, env.WHATSAPP_TOKEN)
  : null;

export const whatsappWorker = new Worker('whatsapp', async (job: Job) => {
  const { leadId, phoneNumber, customerName, context } = job.data;
  logger.info({ leadId, phoneNumber }, 'Processing WhatsApp job');

  const messageBody = `Hi ${customerName || 'there'}, thanks for speaking with me. From our conversation, I understood that you're looking to build an e-commerce store with a budget of roughly ${context.budget || 'your budget'} and a target launch of ${context.timeline || 'soon'}. You mentioned wanting ${context.features || 'specific features'}.

I'd be happy to discuss the next steps.

You can reach me at: ${env.MY_PHONE_NUMBER}
Architecture: ${env.ARCHITECTURE_IMAGE_URL}
Resume: ${env.RESUME_URL}`;

  if (!twilioClient) {
    logger.warn('Twilio client not initialized (dummy token). Simulating WhatsApp message send.');
    logger.info(`Simulated WhatsApp Message:\n${messageBody}`);
    
    await prisma.whatsappMessage.create({
      data: {
        leadId,
        content: messageBody,
        status: 'SIMULATED'
      }
    });
    return;
  }

  try {
    const result = await twilioClient.messages.create({
      from: env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${phoneNumber}`,
      body: messageBody
    });

    logger.info({ messageSid: result.sid }, 'WhatsApp message sent successfully');

    await prisma.whatsappMessage.create({
      data: {
        leadId,
        content: messageBody,
        status: 'SENT'
      }
    });

  } catch (error) {
    logger.error(error as Error, 'Failed to send WhatsApp message via Twilio');
    
    await prisma.whatsappMessage.create({
      data: {
        leadId,
        content: messageBody,
        status: 'FAILED'
      }
    });
    throw error; // Let BullMQ handle retries
  }
}, { connection });

whatsappWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

whatsappWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed with error ${err.message}`);
});
