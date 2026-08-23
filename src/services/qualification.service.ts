import { Lead } from '@prisma/client';
import { logger } from '../utils/logger';

export interface QualificationResult {
  classification: 'HOT' | 'WARM' | 'COLD';
  score: number;
  reasons: string[];
}

export class QualificationService {
  /**
   * Evaluates the structured data of a Lead and returns a classification score and label.
   */
  public qualifyLead(leadState: Partial<Lead>): QualificationResult {
    let score = 0;
    const reasons: string[] = [];

    // 1. Budget Assessment
    if (leadState.budget && leadState.budget.trim().length > 0) {
      const budgetLower = leadState.budget.toLowerCase();
      if (budgetLower.includes('no budget') || budgetLower.includes('free') || budgetLower.includes('not sure yet')) {
        score += 5;
        reasons.push('Vague or no budget explicitly defined');
      } else {
        score += 25;
        reasons.push('Explicit budget mentioned');
      }
    }

    // 2. Timeline Assessment
    if (leadState.timeline && leadState.timeline.trim().length > 0) {
      const timelineLower = leadState.timeline.toLowerCase();
      if (timelineLower.includes('immediate') || timelineLower.includes('asap') || timelineLower.includes('this week') || timelineLower.includes('next month') || timelineLower.includes('days') || timelineLower.includes('weeks')) {
        score += 25;
        reasons.push('Immediate or short-term timeline');
      } else if (timelineLower.includes('months') || timelineLower.includes('later') || timelineLower.includes('next year')) {
        score += 15;
        reasons.push('Long-term timeline');
      } else {
        score += 10;
        reasons.push('Timeline mentioned but vague');
      }
    }

    // 3. Product / Business Context
    if (leadState.businessType || leadState.productsCount) {
      score += 15;
      reasons.push('Provided concrete business details');
    }

    // 4. Feature Requirements
    if (leadState.requiredFeatures && leadState.requiredFeatures.length > 5) {
      score += 15;
      reasons.push('Has specific feature requirements');
    }

    // 5. Buying Signals
    if (leadState.buyingSignals && leadState.buyingSignals.length > 5) {
      score += 20;
      reasons.push('Showed explicit buying signals (asking about next steps, pricing, etc.)');
    }

    // 6. Objections
    if (leadState.objections && leadState.objections.length > 5) {
      score -= 10;
      reasons.push('Raised significant objections or roadblocks');
    }

    // Cap score at 100, floor at 0
    score = Math.max(0, Math.min(100, score));

    // Threshold classification
    let classification: 'HOT' | 'WARM' | 'COLD';
    if (score >= 70) {
      classification = 'HOT';
    } else if (score >= 40) {
      classification = 'WARM';
    } else {
      classification = 'COLD';
    }

    logger.info({ score, classification, reasons }, 'Lead qualification evaluated');

    return {
      classification,
      score,
      reasons,
    };
  }
}

export const qualificationService = new QualificationService();
