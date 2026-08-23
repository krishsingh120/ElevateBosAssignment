import axios from 'axios';
import { env } from '../config/env';
import { log } from '../utils/logger';
import { getSysPrmpt } from '../prompts/systemPrompt';
import { db } from '../db/client';

export class VoiceSvc {
  private url = 'https://api.vapi.ai';
  async callOut(ph: string) {
    log.info({ ph }, 'callOut start');
    let ld = await db.lead.findUnique({ where: { phoneNumber: ph } });
    if (!ld) ld = await db.lead.create({ data: { phoneNumber: ph } });

    const pld = {
      phoneNumber: { twilioPhoneNumber: env.TWILIO_WHATSAPP_NUMBER?.replace('whatsapp:', '') },
      customer: { number: ph },
      assistant: {
        firstMessage: "Hi, I'm from ElevateBox. Are you the biz owner?",
        model: { provider: "google", model: "gemini-1.5-flash", messages: [{ role: "system", content: getSysPrmpt(env.MY_PHONE_NUMBER || '') }] },
        voice: { provider: "11labs", voiceId: "eleven_multilingual_v2" },
        transcriber: { provider: "openai", model: "whisper-1" },
        metadata: { leadId: ld.id }
      }
    };

    if (env.VOICE_API_KEY === 'dummy_vapi_key') {
      log.warn('Sim DEMO call');
      const sId = `demo-${Date.now()}`;
      await db.call.create({ data: { leadId: ld.id, providerCallId: sId, status: 'init' } });
      return sId;
    }
    try {
      const res = await axios.post(`${this.url}/call/phone`, pld, { headers: { Authorization: `Bearer ${env.VOICE_API_KEY}` } });
      await db.call.create({ data: { leadId: ld.id, providerCallId: res.data.id, status: 'init' } });
      return res.data.id;
    } catch (e: any) {
      log.error({ err: e.response?.data || e.message }, 'callOut fail');
      return null;
    }
  }
}
export const vSvc = new VoiceSvc();
