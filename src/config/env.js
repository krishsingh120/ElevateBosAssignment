"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('3000'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    GEMINI_API_KEY: zod_1.z.string().min(1, "GEMINI_API_KEY is required"),
    VOICE_PROVIDER: zod_1.z.string().min(1, "VOICE_PROVIDER is required"),
    VOICE_API_KEY: zod_1.z.string().min(1, "VOICE_API_KEY is required"),
    WHATSAPP_PROVIDER: zod_1.z.string().min(1, "WHATSAPP_PROVIDER is required"),
    WHATSAPP_TOKEN: zod_1.z.string().min(1, "WHATSAPP_TOKEN is required"),
    TWILIO_ACCOUNT_SID: zod_1.z.string().optional(),
    TWILIO_WHATSAPP_NUMBER: zod_1.z.string().optional(),
    REDIS_URL: zod_1.z.string().min(1, "REDIS_URL is required"),
    DATABASE_URL: zod_1.z.string().min(1, "DATABASE_URL is required"),
    TARGET_PHONE_NUMBER: zod_1.z.string().min(10, "TARGET_PHONE_NUMBER is required"),
    MY_PHONE_NUMBER: zod_1.z.string().min(10, "MY_PHONE_NUMBER is required"),
    RESUME_URL: zod_1.z.string().url("RESUME_URL must be a valid URL"),
    ARCHITECTURE_IMAGE_URL: zod_1.z.string().url("ARCHITECTURE_IMAGE_URL must be a valid URL"),
});
const _env = envSchema.safeParse(process.env);
if (!_env.success) {
    console.error("❌ Invalid environment variables:", _env.error.format());
    process.exit(1);
}
exports.env = _env.data;
//# sourceMappingURL=env.js.map