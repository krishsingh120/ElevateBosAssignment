import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { getVoiceAgentSystemPrompt } from '../prompts/systemPrompt';
import { prisma } from '../db/client';

export class VoiceService {
  private readonly vapiBaseUrl = 'https://api.vapi.ai';

  public async initiateOutboundCall(phoneNumber: string): Promise<string | null> {
    logger.info({ phoneNumber }, 'Initiating outbound call request');

    // Create a new lead record if it doesn't exist, or just use a dummy lead ID for now.
    // In a full implementation, we'd look up the lead by phone number.
    let lead = await prisma.lead.findUnique({ where: { phoneNumber } });
    if (!lead) {
      lead = await prisma.lead.create({
        data: { phoneNumber },
      });
    }

    // Prepare Vapi payload
    const systemPrompt = getVoiceAgentSystemPrompt(env.MY_PHONE_NUMBER);

    const payload = {
      phoneNumber: {
        twilioPhoneNumber: env.TWILIO_WHATSAPP_NUMBER?.replace('whatsapp:', ''), // Fallback using twilio number, normally you'd use a dedicated voice number
      },
      customer: {
        number: phoneNumber,
      },
      assistant: {
        firstMessage: "Hi, this is a friendly consultant from ElevateBox. Am I speaking with the business owner?",
        model: {
          provider: "google",
          model: "gemini-1.5-flash",
          messages: [
            {
              role: "system",
              content: systemPrompt
            }
          ]
        },
        voice: {
          provider: "11labs",
          voiceId: "eleven_monolingual_v1", // Dummy ID, usually you pick a natural female voice
        },
        metadata: {
          leadId: lead.id
        }
      }
    };

    if (env.VOICE_API_KEY === 'dummy_vapi_key') {
      logger.warn('Dummy VAPI key detected. Simulating outbound call logic in DEMO mode.');
      // Simulate successful call initiation
      const simulatedCallId = `demo-call-${Date.now()}`;
      await prisma.call.create({
        data: {
          leadId: lead.id,
          providerCallId: simulatedCallId,
          status: 'initiated',
        }
      });
      return simulatedCallId;
    }

    try {
      const response = await axios.post(`${this.vapiBaseUrl}/call/phone`, payload, {
        headers: {
          'Authorization': `Bearer ${env.VOICE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const callId = response.data.id;
      
      await prisma.call.create({
        data: {
          leadId: lead.id,
          providerCallId: callId,
          status: 'initiated',
        }
      });

      logger.info({ callId }, 'Successfully initiated Vapi outbound call');
      return callId;
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Failed to initiate outbound call');
      return null;
    }
  }
}

export const voiceService = new VoiceService();
