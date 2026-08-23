import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { log } from '../utils/logger';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export class AISvc {
  private mdl = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  async extCtx(txt: string) {
    const p = `Extract e-commerce info from transcript.
Structure: {"customerName": string|null, "businessType": string|null, "productsCount": string|null, "budget": string|null, "timeline": string|null, "requiredFeatures": string|null, "objections": string|null, "decisionMaker": string|null, "buyingSignals": string|null}
Transcript: """${txt}"""`;
    try {
      const res = await this.mdl.generateContent(p);
      const str = res.response.text().trim().replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(str);
    } catch (e) {
      log.error(e as Error, 'extCtx fail');
      return null;
    }
  }

  async parseTime(phrase: string) {
    const p = `Parse time to ISO. Tz: Asia/Kolkata. Now: ${new Date().toISOString()}. Phrase: "${phrase}". Output JSON: {"timestamp":"YYYY-MM-DDTHH:mm:ss.sssZ","confidence":number}`;
    try {
      const res = await this.mdl.generateContent(p);
      const str = res.response.text().trim().replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(str);
    } catch (e) {
      log.error(e as Error, 'parseTime fail');
      return null;
    }
  }
}
export const aiSvc = new AISvc();
