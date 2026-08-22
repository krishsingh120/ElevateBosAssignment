# ElevateBox AI Sales Voice Agent

## Project Overview
An AI outbound sales voice agent for e-commerce website development. Built for the ElevateBox SDE Intern assignment. 
It places calls, converses in natural languages (English, Hindi, Telugu), detects high intent, triggers WhatsApp mid-call, schedules callbacks, and generates followups.

## Architecture
- **Backend:** Node.js, Fastify, TypeScript
- **AI/LLM:** Gemini 1.5 Flash
- **Voice Provider:** Vapi.ai (handles WebRTC, STT, TTS, Interruption)
- **WhatsApp:** Twilio Sandbox API
- **Database:** SQLite
- **Jobs/Queue:** Upstash Redis + BullMQ (For async WhatsApp/scheduling without blocking voice latency)

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and configure keys.
3. `npm run dev` to start locally.
4. Expose the local server to internet via ngrok for webhooks: `ngrok http 3000`.

## Scripts
- `npm run dev`: Run locally with ts-node
- `npm run build`: Build typescript to dist/
- `npm start`: Run the built code
- `npm run lint`: Lint code
- `npm test`: Run tests

## Workflow
This project is built incrementally in phases according to assignment instructions.

## Known Limitations / Cost Notes
- Currently using Vapi.ai Free Trial and Twilio Free Trial.
- Outbound calling requires a verified number on the trial account.
- WhatsApp requires the user to join the Twilio sandbox or configuring Meta Cloud API.
