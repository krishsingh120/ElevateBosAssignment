import { Lead } from '@prisma/client';
import { log } from '../utils/logger';

export class QualSvc {
  qual(ld: Partial<Lead>) {
    let s = 0;
    const r: string[] = [];

    if (ld.budget?.trim()) {
      const b = ld.budget.toLowerCase();
      if (b.includes('no budget') || b.includes('free') || b.includes('not sure')) {
        s += 5; r.push('No/vague budget');
      } else {
        s += 25; r.push('Has budget');
      }
    }
    if (ld.timeline?.trim()) {
      const t = ld.timeline.toLowerCase();
      if (t.includes('immediate') || t.includes('asap') || t.includes('week') || t.includes('days')) {
        s += 25; r.push('Short term');
      } else if (t.includes('month') || t.includes('later') || t.includes('year')) {
        s += 15; r.push('Long term');
      } else {
        s += 10; r.push('Vague timeline');
      }
    }
    if (ld.businessType || ld.productsCount) { s += 15; r.push('Has biz details'); }
    if (ld.requiredFeatures && ld.requiredFeatures.length > 5) { s += 15; r.push('Has features'); }
    if (ld.buyingSignals && ld.buyingSignals.length > 5) { s += 20; r.push('Buying signals'); }
    if (ld.objections && ld.objections.length > 5) { s -= 10; r.push('Objections'); }

    s = Math.max(0, Math.min(100, s));
    const cls = s >= 70 ? 'HOT' : s >= 40 ? 'WARM' : 'COLD';
    log.info({ s, cls, r }, 'Qual done');
    return { cls, s, r };
  }
}
export const qSvc = new QualSvc();
