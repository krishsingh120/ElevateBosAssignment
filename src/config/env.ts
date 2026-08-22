import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  
  VOICE_PROVIDER: z.string().min(1, "VOICE_PROVIDER is required"),
  VOICE_API_KEY: z.string().min(1, "VOICE_API_KEY is required"),
  
  WHATSAPP_PROVIDER: z.string().min(1, "WHATSAPP_PROVIDER is required"),
  WHATSAPP_TOKEN: z.string().min(1, "WHATSAPP_TOKEN is required"),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_WHATSAPP_NUMBER: z.string().optional(),
  
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  
  TARGET_PHONE_NUMBER: z.string().min(10, "TARGET_PHONE_NUMBER is required"),
  MY_PHONE_NUMBER: z.string().min(10, "MY_PHONE_NUMBER is required"),
  
  RESUME_URL: z.string().url("RESUME_URL must be a valid URL"),
  ARCHITECTURE_IMAGE_URL: z.string().url("ARCHITECTURE_IMAGE_URL must be a valid URL"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;
