import { FastifyRequest, FastifyReply } from 'fastify';
import { log } from '../utils/logger';
import { db } from '../db/client';
import { aiSvc } from '../services/ai.service';
import { qSvc } from '../services/qualification.service';

export const handleVapi = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const p = req.body as any;
    const t = p?.message?.type;
    const cId = p?.message?.call?.id;
    const lId = p?.message?.call?.assistant?.metadata?.leadId;

    if (!cId) return res.status(200).send({});
    log.debug({ t, cId }, 'VAPI wh');

    if (t === 'transcript') {
      const txt = p?.message?.transcript;
      if (txt) await db.conversationEvent.create({ data: { callId: cId, role: p?.message?.role || 'u', message: txt } });
    } else if (t === 'end-of-call-report') {
      const txt = p?.message?.transcript;
      await db.call.update({ where: { providerCallId: cId }, data: { status: 'completed', transcript: txt } });
      
      if (lId && txt) {
        const d = await aiSvc.extCtx(txt);
        if (d) {
          const l = await db.lead.update({
            where: { id: lId },
            data: { customerName: d.customerName, businessType: d.businessType, productsCount: d.productsCount, budget: d.budget, timeline: d.timeline, requiredFeatures: d.requiredFeatures, objections: d.objections, decisionMaker: d.decisionMaker, buyingSignals: d.buyingSignals }
          });
          const { cls, s, r } = qSvc.qual(l);
          const uLd = await db.lead.update({ where: { id: lId }, data: { classification: cls, intentScore: s, classificationReasons: JSON.stringify(r) } });
          try {
             const { waQ } = await import('../jobs/queue.js');
             await waQ.add('postCallWA', {
               leadId: lId,
               phone: p?.message?.call?.customer?.number,
               name: uLd.customerName,
               ctx: { budget: uLd.budget, timeline: uLd.timeline, features: uLd.requiredFeatures }
             });
          } catch(e) {}
        }
      }
    } else if (t === 'tool-calls') {
      const tcs = p?.message?.toolCalls;
      if (tcs) {
        for (const c of tcs) {
          if (c.function?.name === 'send_high_intent_whatsapp') {
            const { waQ } = await import('../jobs/queue.js');
            await waQ.add('sendWa', { leadId: lId, phone: p?.message?.call?.customer?.number, name: c.function.arguments.customerName, ctx: c.function.arguments.context || c.function.arguments });
          } else if (c.function?.name === 'schedule_callback') {
            const a = c.function.arguments;
            const t = await aiSvc.parseTime(a.phrase || a.datetime || a);
            if (t?.timestamp) {
              const dt = new Date(t.timestamp);
              const cb = await db.callback.create({ data: { leadId: lId, originalPhrase: a.phrase || a.datetime || a, scheduledFor: dt, status: 'SCHEDULED' } });
              const { cbQ } = await import('../jobs/queue.js');
              await cbQ.add('execCb', { leadId: lId, cbId: cb.id, phone: p?.message?.call?.customer?.number }, { delay: Math.max(0, dt.getTime() - Date.now()) });
            }
          }
        }
      }
    }
    return res.status(200).send({});
  } catch (e) {
    log.error(e as Error, 'wh err');
    return res.status(500).send({});
  }
};
