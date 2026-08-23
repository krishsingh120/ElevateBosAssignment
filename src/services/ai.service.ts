import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Initialize Gemini SDK
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export class AIService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  /**
   * Helper function to extract structured context from a conversation transcript.
   * Useful as a fallback or background task if the real-time voice agent doesn't extract perfectly.
   */
  async extractStructuredContext(transcript: string) {
    logger.info('Extracting structured context from transcript using Gemini...');
    
    const prompt = `
      You are an expert sales analyst. Read the following call transcript and extract the key information.
      Return the output as a valid JSON object matching the following structure exactly. Do not include markdown code blocks.
      
      Structure:
      {
        "customerName": string | null,
        "businessType": string | null,
        "productsCount": string | null,
        "budget": string | null,
        "timeline": string | null,
        "requiredFeatures": string | null,
        "objections": string | null,
        "decisionMaker": string | null,
        "buyingSignals": string | null
      }

      Transcript:
      """
      ${transcript}
      """
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      // Clean up markdown if the model accidentally included it
      const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonString);
    } catch (error) {
      logger.error(error as Error, 'Failed to extract structured context');
      return null;
    }
  }

  /**
   * Parses natural language date/time into an ISO timestamp.
   * Calculates relative to Asia/Kolkata timezone context.
   */
  async parseCallbackTime(phrase: string): Promise<{ timestamp: string, confidence: number } | null> {
    const prompt = `
      You are a datetime extraction parser. The user is in "Asia/Kolkata" timezone.
      The current time is ${new Date().toISOString()}.
      
      The user said: "${phrase}"
      
      Calculate the exact future ISO 8601 timestamp for this callback.
      Return the output as a valid JSON object matching the following structure exactly. Do not include markdown.
      
      Structure:
      {
        "timestamp": "YYYY-MM-DDTHH:mm:ss.sssZ",
        "confidence": number (0 to 100)
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text().trim();
      const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonString);
    } catch (error) {
      logger.error(error as Error, 'Failed to parse callback time');
      return null;
    }
  }
}

export const aiService = new AIService();
