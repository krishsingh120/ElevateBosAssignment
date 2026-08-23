import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';
import { prisma } from '../db/client';
import { aiService } from '../services/ai.service';
import { qualificationService } from '../services/qualification.service';

export const handleVapiWebhook = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const payload = request.body as any;
    const type = payload?.message?.type;
    const callId = payload?.message?.call?.id;
    const leadId = payload?.message?.call?.assistant?.metadata?.leadId;

    if (!callId) {
      return reply.status(200).send({ message: 'No callId in payload, ignoring' });
    }

    logger.debug({ type, callId }, 'Received VAPI webhook');

    switch (type) {
      case 'transcript':
        const role = payload?.message?.role;
        const transcriptText = payload?.message?.transcript;
        if (transcriptText) {
          await prisma.conversationEvent.create({
            data: {
              callId,
              role: role || 'unknown',
              message: transcriptText,
            }
          });
        }
        break;

      case 'end-of-call-report':
        const transcript = payload?.message?.transcript;
        const recordingUrl = payload?.message?.recordingUrl;

        await prisma.call.update({
          where: { providerCallId: callId },
          data: {
            status: 'completed',
            transcript: transcript,
          }
        });

        if (leadId && transcript) {
          // Extract structured context and update lead
          const structuredData = await aiService.extractStructuredContext(transcript);
          if (structuredData) {
            const updatedLead = await prisma.lead.update({
              where: { id: leadId },
              data: {
                customerName: structuredData.customerName,
                businessType: structuredData.businessType,
                productsCount: structuredData.productsCount,
                budget: structuredData.budget,
                timeline: structuredData.timeline,
                requiredFeatures: structuredData.requiredFeatures,
                objections: structuredData.objections,
                decisionMaker: structuredData.decisionMaker,
                buyingSignals: structuredData.buyingSignals,
              }
            });

            // Qualify the lead
            const { classification, score, reasons } = qualificationService.qualifyLead(updatedLead);
            await prisma.lead.update({
              where: { id: leadId },
              data: {
                classification,
                intentScore: score,
                classificationReasons: JSON.stringify(reasons)
              }
            });

            // Generate a context-aware follow-up draft based on the structured data
            const draftPrompt = `Based on this e-commerce lead data, draft a short, professional, and personalized follow-up message to send them. Data: ${JSON.stringify(updatedLead)}.`;
            const draftResult = await aiService.extractStructuredContext(draftPrompt); // Reusing method for quick generation or we can just call Gemini directly. Wait, extractStructuredContext expects JSON. 
            // I'll call the model directly here for a simple string
            try {
               const model = (aiService as any).model; // Accessing private for quick draft
               const result = await model.generateContent(draftPrompt);
               const followupContent = result.response.text().trim();
               
               await prisma.followup.create({
                 data: {
                   leadId,
                   content: followupContent,
                   status: 'PENDING'
                 }
               });
               logger.info('Generated post-call context-aware follow-up draft');
            } catch (err) {
               logger.error('Failed to generate follow-up draft');
            }
          }
        }
        break;

      case 'tool-calls':
        const toolCalls = payload?.message?.toolCalls;
        if (toolCalls && toolCalls.length > 0) {
          for (const call of toolCalls) {
            if (call.function?.name === 'send_high_intent_whatsapp') {
              const args = call.function.arguments;
              
              // Import queue lazily to avoid connection initialization if not needed
              const { whatsappQueue } = await import('../jobs/queue.js');
              
              await whatsappQueue.add('sendWhatsApp', {
                leadId: leadId,
                phoneNumber: payload?.message?.call?.customer?.number,
                customerName: args.customerName,
                context: args.context || args
              });
              
              logger.info('Dispatched high intent WhatsApp job to BullMQ');
            } else if (call.function?.name === 'schedule_callback') {
              const args = call.function.arguments;
              const phrase = args.phrase || args.datetime || args;
              
              const parsedTime = await aiService.parseCallbackTime(phrase);
              if (parsedTime && parsedTime.timestamp) {
                const scheduledDate = new Date(parsedTime.timestamp);
                
                // Save to database
                const callbackRecord = await prisma.callback.create({
                  data: {
                    leadId: leadId,
                    originalPhrase: phrase,
                    scheduledFor: scheduledDate,
                    status: 'SCHEDULED'
                  }
                });

                // Import queue lazily
                const { callbackQueue } = await import('../jobs/queue.js');
                
                // Calculate delay in milliseconds
                const delay = Math.max(0, scheduledDate.getTime() - Date.now());
                
                await callbackQueue.add('executeCallback', {
                  leadId: leadId,
                  callbackId: callbackRecord.id,
                  phoneNumber: payload?.message?.call?.customer?.number,
                }, { delay });
                
                logger.info({ delayMs: delay, phrase }, 'Dispatched delayed callback job to BullMQ');
              } else {
                logger.warn('Failed to parse callback time from AI Service');
              }
            }
          }
        }
        break;
        
      default:
        // Handle other VAPI events if needed
        break;
    }

    // Always respond 200 OK so VAPI knows we got it
    return reply.status(200).send({});
  } catch (error) {
    logger.error(error as Error, 'Error handling VAPI webhook');
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
