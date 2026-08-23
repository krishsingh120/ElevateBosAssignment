# ElevateBox AI Sales Voice Agent 🚀

A production-ready AI outbound sales voice agent tailored for e-commerce website development. Designed for the ElevateBox SDE Intern assignment, this robust prototype features real-time conversational intelligence, automated lead scoring, dynamic mid-call WhatsApp dispatching, and natural language callback scheduling.

---

## ✨ Features

- **Outbound Voice Calling**: Integrates with Vapi.ai to place low-latency, human-like voice calls.
- **Multilingual Persona**: A customized Gemini 1.5 Flash AI agent that seamlessly transitions between English, Hindi, and Telugu while pitching e-commerce development services.
- **Automated Lead Qualification**: Deterministically scores leads (0-100) and categorizes them as `HOT`, `WARM`, or `COLD` based on budget, timeline, and buying signals extracted from the conversation transcript.
- **Mid-Call WhatsApp Triggers**: Utilizes BullMQ & Upstash Redis to dispatch high-intent WhatsApp messages via Twilio *during* the call, without blocking the voice agent's conversational latency.
- **Natural Language Scheduling**: Intelligently parses time phrases (e.g., "Call me tomorrow evening") into strict UTC timestamps based on `Asia/Kolkata` timezone context to queue automated callback jobs.
- **Context-Aware Follow-ups**: Generates personalized post-call follow-up drafts summarizing the user's specific business needs and budget.

## 🏗️ Architecture Stack

- **Backend**: Node.js, Fastify, TypeScript
- **Database**: SQLite (via Prisma ORM)
- **AI / LLM**: Google Gemini 1.5 Flash (`@google/generative-ai`)
- **Voice Provider**: Vapi.ai
- **Messaging**: Twilio Sandbox API (WhatsApp)
- **Message Queue**: Upstash Redis + BullMQ (For asynchronous processing)

---

## 🛠️ Setup & Installation

### 1. Clone & Install
```bash
git clone https://github.com/krishsingh120/ElevateBosAssignment.git
cd ElevateBoxAssignment
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and configure the following keys:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL="file:./dev.db"

# API Keys
VOICE_API_KEY="your_vapi_api_key"
GEMINI_API_KEY="your_gemini_api_key"
REDIS_URL="your_upstash_redis_url"

# Twilio (Optional: Use 'dummy_twilio_token' to simulate locally)
TWILIO_ACCOUNT_SID="your_twilio_sid"
WHATSAPP_TOKEN="your_twilio_auth_token"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"

# Agent Variables
MY_PHONE_NUMBER="+919876543210"
ARCHITECTURE_IMAGE_URL="https://example.com/arch.png"
RESUME_URL="https://example.com/resume.pdf"
```
*(Note: If you use `dummy_vapi_key` or `dummy_twilio_token`, the system will gracefully simulate the API calls to save on trial credits.)*

### 3. Initialize Database
Sync the Prisma schema to create the local SQLite database.
```bash
npx prisma generate
npx prisma db push
```

### 4. Run the Server
```bash
npm run build
npm run dev
```

### 5. Expose for Webhooks (Required for Vapi events)
Use ngrok to expose your local server so Vapi can send conversation webhooks:
```bash
ngrok http 3000
```
*Copy the resulting Ngrok URL and set it as your Server URL in the Vapi.ai dashboard pointing to `/api/webhooks/vapi`.*

---

## 💻 Available Scripts

- `npm run dev`: Runs the application in development mode with `ts-node`.
- `npm run build`: Compiles TypeScript to the `dist/` directory.
- `npm start`: Runs the compiled code.
- `npm run lint`: Checks for linting errors.

---

## 📂 Project Structure

```
├── prisma/
│   └── schema.prisma         # Database schema (Lead, Call, Followup, WhatsApp Message, Callback)
├── src/
│   ├── config/               # Environment validation (Zod)
│   ├── db/                   # Prisma client singleton
│   ├── jobs/                 # BullMQ queues & background workers (WhatsApp, Callbacks)
│   ├── prompts/              # System Prompts for the AI Voice Agent
│   ├── services/             # Core business logic (AI, Qualification, Voice)
│   ├── utils/                # Pino Logger
│   ├── webhooks/             # Vapi Webhook consumer
│   ├── app.ts                # Fastify App instantiation & Routing
│   └── server.ts             # Server entry point
```

---

## ⚠️ Known Limitations
- The project is designed to run on Vapi.ai and Twilio Free Trials.
- Making actual outbound calls requires a verified destination number on Vapi's trial account.
- Receiving WhatsApp messages requires joining the Twilio Sandbox from the recipient's phone.
