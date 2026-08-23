import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string(),
  VOICE_API_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  REDIS_URL: z.string().url(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  WHATSAPP_TOKEN: z.string().optional(),
  TWILIO_WHATSAPP_NUMBER: z.string().optional(),
  MY_PHONE_NUMBER: z.string().optional(),
  ARCHITECTURE_IMAGE_URL: z.string().optional(),
  RESUME_URL: z.string().optional(),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Env error:', parsed.error.format());
  process.exit(1);
}
export const env = parsed.data;
