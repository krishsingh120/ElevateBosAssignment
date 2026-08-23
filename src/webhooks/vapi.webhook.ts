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
