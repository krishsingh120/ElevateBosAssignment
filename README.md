# ElevateBox AI Sales Voice Agent 🚀

A working AI outbound sales voice-agent prototype built for the **ElevateBox SDE Intern Assignment**.

The system is designed for e-commerce website sales and focuses on real-time conversational intelligence, multilingual interaction, deterministic lead qualification, mid-call WhatsApp actions, natural-language callback scheduling, and context-aware follow-ups.

The implementation prioritizes a **simple, clean, and reliable backend architecture** over unnecessary complexity.

---

## ✨ Features

* **Outbound Voice Calling** — Integrates with **Vapi.ai** for low-latency outbound AI voice calls.
* **Multilingual Conversation** — Supports **English, Hindi, and Telugu**, including natural language switching during conversations.
* **E-commerce Sales Agent** — Conducts a natural sales conversation and discovers the customer's business, product count, budget, timeline, and required features.
* **Automated Lead Qualification** — Deterministically calculates an intent score from `0–100` and classifies leads as `HOT`, `WARM`, or `COLD`.
* **Mid-Call WhatsApp Trigger** — Uses **BullMQ + Upstash Redis** to asynchronously dispatch a WhatsApp message when a high-intent lead is detected, without blocking the active voice conversation.
* **Natural-Language Callback Scheduling** — Converts phrases such as `"Call me tomorrow evening"` into scheduled callback jobs using the `Asia/Kolkata` timezone.
* **Context-Aware Follow-ups** — Generates personalized follow-up content using the actual business requirements, budget, timeline, and features discussed during the call.
* **Structured Conversation Data** — Persists lead, call, callback, WhatsApp, and follow-up information for debugging and future processing.
* **Demo Mode** — Supports local simulation when real provider credentials are unavailable.

---

## 🏗️ Architecture Stack

| Layer           | Technology                   |
| --------------- | ---------------------------- |
| Backend         | Node.js, Fastify, TypeScript |
| Validation      | Zod                          |
| Database        | SQLite + Prisma ORM          |
| AI / LLM        | Google Gemini Flash          |
| Voice           | Vapi.ai                      |
| WhatsApp        | Twilio WhatsApp Sandbox      |
| Queue           | BullMQ                       |
| Redis           | Upstash Redis                |
| Logging         | Pino                         |
| Webhooks        | Fastify Webhooks             |
| Local Tunneling | ngrok                        |

### High-Level Flow

```text
                    ┌───────────────────┐
                    │     Customer      │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │   Vapi Voice AI   │
                    │  Outbound Call    │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ Conversation /    │
                    │ Gemini Intelligence│
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ Lead Qualification│
                    │   0–100 Score     │
                    └──────┬─────┬──────┘
                           │     │
                    HOT    │     │ WARM / COLD
                           │     │
                           ▼     ▼
                    ┌──────────┐  ┌────────────┐
                    │ WhatsApp │  │ Follow-up  │
                    │ Mid-Call │  │ / Callback │
                    └────┬─────┘  └─────┬──────┘
                         │              │
                         ▼              ▼
                    ┌────────────────────────┐
                    │     BullMQ + Redis     │
                    └────────────┬───────────┘
                                 │
                                 ▼
                         ┌──────────────┐
                         │ SQLite/Prisma│
                         └──────────────┘
```

---

## 🛠️ Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/krishsingh120/ElevateBosAssignment.git
cd ElevateBosAssignment
npm install
```

---

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="file:./dev.db"

# AI
GEMINI_API_KEY="your_gemini_api_key"

# Voice
VOICE_API_KEY="your_vapi_api_key"

# Redis
REDIS_URL="your_upstash_redis_url"

# Twilio WhatsApp
TWILIO_ACCOUNT_SID="your_twilio_account_sid"
WHATSAPP_TOKEN="your_twilio_auth_token"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"

# Agent
MY_PHONE_NUMBER="+91XXXXXXXXXX"

# Public assets
ARCHITECTURE_IMAGE_URL="https://your-public-url/architecture.png"
RESUME_URL="https://your-public-url/resume.pdf"
```

> **Security:** Never commit `.env` or real API keys. Use `.env.example` for configuration documentation.

---

### 3. Initialize the Database

Generate Prisma Client and create/update the SQLite database:

```bash
npx prisma generate
npx prisma db push
```

---

### 4. Start the Application

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

---

### 5. Expose Webhooks

Vapi requires a publicly accessible webhook endpoint for events.

For local development:

```bash
ngrok http 3000
```

Copy the generated public URL and configure the Vapi server URL:

```text
https://YOUR-NGROK-DOMAIN/api/webhooks/vapi
```

---

## 💻 Available Scripts

```bash
npm run dev
```

Starts the development server.

```bash
npm run build
```

Compiles the TypeScript application.

```bash
npm start
```

Starts the compiled production application.

```bash
npm run lint
```

Runs ESLint.

```bash
npm test
```

Runs the test suite, if configured.

---

## 📂 Project Structure

```text
├── prisma/
│   └── schema.prisma
│
├── src/
│   ├── config/
│   │   └── Environment validation
│   │
│   ├── db/
│   │   └── Prisma client
│   │
│   ├── jobs/
│   │   └── WhatsApp & callback workers
│   │
│   ├── prompts/
│   │   └── Voice-agent system prompts
│   │
│   ├── services/
│   │   ├── AI
│   │   ├── Qualification
│   │   └── Voice
│   │
│   ├── utils/
│   │   └── Logger
│   │
│   ├── webhooks/
│   │   └── Vapi webhook handlers
│   │
│   ├── app.ts
│   └── server.ts
│
├── .env.example
├── package.json
├── prisma.config.*
└── README.md
```

---

## 🎯 Lead Qualification

The qualification engine produces an intent score between `0–100`.

```text
70–100 → HOT
40–69  → WARM
0–39   → COLD
```

### HOT

Typical signals:

* Clear budget
* Immediate requirement
* Specific timeline
* Asking about pricing or implementation
* Asking about next steps

### WARM

Typical signals:

* Genuine requirement
* Interested but not ready
* Budget uncertainty
* Delayed timeline
* Another person is involved in the decision

### COLD

Typical signals:

* Just browsing
* No clear requirement
* No defined timeline
* No budget
* Not interested

The system stores the score, classification, reasoning, and conversation evidence.

---

## 📱 Mid-Call WhatsApp

For a `HOT` lead, the system can trigger the WhatsApp workflow **while the voice call is still active**.

```text
Conversation
     ↓
Intent Update
     ↓
HOT detected
     ↓
BullMQ Job
     ↓
Twilio WhatsApp
     ↓
Message sent
     ↓
Voice conversation continues
```

The WhatsApp operation is asynchronous so that messaging does not unnecessarily block the real-time voice conversation.

The message is generated from the actual conversation context rather than a generic template.

---

## 📅 Callback Scheduling

The agent can understand natural-language callback requests such as:

```text
"Call me tomorrow morning."

"Call me Monday around 11."

"Next week afternoon would be better."

"Saturday after 5."
```

The requested time is interpreted using:

```text
Timezone: Asia/Kolkata
```

The system then creates a callback job for the requested time.

If the request is ambiguous, the agent should ask for clarification rather than silently making an important scheduling assumption.

---

## 🌐 Multilingual Conversation

The voice agent supports:

* English
* Hindi
* Telugu

It is also designed to handle natural code-switching.

Examples:

```text
"Haan, mujhe ek online store chahiye."

"Budget around 50 hazaar hai."

"Products almost 100 hain."

"Website next month tak live chahiye."
```

The agent attempts to respond in the customer's current language rather than forcing the conversation into English.

---

## 🧪 Demo Mode

A local/demo mode is available for development when real provider credentials are unavailable.

Demo mode can simulate:

* Customer conversation
* Agent responses
* Lead qualification
* WhatsApp trigger
* Callback scheduling

**Demo mode is for development/testing only.**

The final assignment evaluation should use the real voice provider whenever the required provider credentials and calling configuration are available.

---

## 🔐 Security

The following must never be committed to GitHub:

```text
.env
API keys
Provider credentials
Redis credentials
Twilio credentials
Gemini API keys
Vapi API keys
```

Use:

```text
.env.example
```

for documenting required environment variables.

---

## ⚠️ Current Provider Limitations

This prototype depends on external voice and messaging providers.

### Vapi

Actual outbound calling depends on the configured Vapi phone-number/telephony setup and the applicable account/number restrictions.

### Twilio WhatsApp Sandbox

The WhatsApp Sandbox has onboarding restrictions. A recipient may need to join/configure the Sandbox before receiving Sandbox messages.

These provider restrictions are external to the application itself.

---

## 📌 Assignment Deliverables

The ElevateBox assignment requires:

1. Working live prototype
2. GitHub repository
3. One-page architecture diagram
4. Short note under 200 words covering:

   * What works
   * What does not work
   * What would be built next
5. Resume
6. Mobile number

The working prototype is intended to be sent to the number provided in the assignment.

---

## 🔗 Repository

**GitHub:**
https://github.com/krishsingh120/ElevateBosAssignment

---

## 👨‍💻 Author

**Krish Singh**

Backend Developer | Node.js | TypeScript | Distributed Systems | GenAI

Built as part of the **ElevateBox SDE Intern Assignment**.
