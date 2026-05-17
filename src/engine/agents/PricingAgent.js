import { eventBus, EVENTS } from '../EventBus.js';
import { orchestrator } from '../Orchestrator.js';

class PricingAgent {
  constructor() {
    eventBus.subscribe(EVENTS.PROVIDER_SELECTED, this.calculatePrice.bind(this));
  }

  calculatePrice(payload) {
    const state = orchestrator.getState();
    const intent = state.extractedIntent || {};
    const provider = state.selectedProvider || {};
    const isUrgent = intent.urgency === 'High';
    const budget = intent.budget || null;
    const isSurge = state.failures > 0;
    
    setTimeout(() => {
      // Base price from provider's rate, fallback to category default
      let base = provider.basePrice || 2000;

      // Distance-based travel fee
      let travel = Math.round((provider.baseDistance || 3) * 80);

      // Peak Hours Rule → surge +15%
      const currentHour = new Date().getHours();
      const isPeakHour = (currentHour >= 8 && currentHour <= 10) || (currentHour >= 17 && currentHour <= 20);
      let peakSurge = isPeakHour ? Math.round(base * 0.15) : 0;

      // Heavy traffic area → travel multiplier
      if (intent.location && intent.location.toLowerCase().includes('bahria')) {
        travel = Math.round(travel * 1.5);
      }
      
      // Urgency → surge +25% of base
      let urgencyFee = isUrgent ? Math.round(base * 0.25) : 0;
      
      // Weekend rule → +10% base
      const day = new Date().getDay();
      if (day === 0 || day === 6) {
        base = Math.round(base * 1.10);
      }
      
      // Recovery surge (provider cancelled, re-assignment cost)
      let recoverySurge = isSurge ? 500 : 0;
      
      let totalSurge = peakSurge + recoverySurge;
      let subTotal = base + travel + urgencyFee + totalSurge;
      
      // Market variance ±5% for realistic behavior
      const varianceFactor = 1 + ((Math.random() * 0.1) - 0.05);
      let total = Math.round(subTotal * varianceFactor);
      let varianceAmount = total - subTotal;
      
      // Low budget discount logic
      if (budget && budget > 0 && total > budget && (total - budget) < 1000) {
        const discount = total - budget;
        total -= discount;
        varianceAmount -= discount;
        eventBus.emit(EVENTS.SYSTEM_LOG, {
          agent: 'PricingAgent', action: 'DISCOUNT_APPLIED',
          trace: `Budget Alignment: Applied Rs ${discount} loyalty discount to meet user budget constraint of Rs ${budget}. Provider ecosystem impact: minimal.`,
          confidence: 1.0, toolUsed: 'Reason: Automated budget alignment logic'
        });
      }

      // Build detailed trace for transparent breakdown
      const surgeReasons = [];
      if (isPeakHour) surgeReasons.push(`Peak Hour (+Rs${peakSurge})`);
      if (isSurge) surgeReasons.push(`Recovery Re-assignment (+Rs${recoverySurge})`);
      if (day === 0 || day === 6) surgeReasons.push('Weekend Rate Applied');
      const surgeNote = surgeReasons.length > 0 ? surgeReasons.join(', ') : 'No surge conditions active';

      const pricing = { base, travel, urgency: urgencyFee, surge: totalSurge, variance: varianceAmount, total };

      eventBus.emit(EVENTS.PRICE_CALCULATED, { 
        agent: 'PricingAgent',
        trace: `Dynamic pricing matrix executed:\n• Base Rate: Rs ${base} (Provider: ${provider.name})\n• Travel Fee: Rs ${travel} (${(provider.baseDistance || 3).toFixed(1)} km × Rs 80/km${intent.location?.toLowerCase().includes('bahria') ? ' × 1.5 Bahria heavy-traffic surcharge' : ''})\n• Urgency Surge: Rs ${urgencyFee} (${isUrgent ? '+25% urgent' : 'standard'})\n• Market Conditions: ${surgeNote}\n• Total: Rs ${total}`,
        confidence: 0.98,
        toolUsed: 'Reason: Applied dynamic surge matrix and historical constraints',
        pricing 
      });

    }, 800);
  }
}

export const pricingAgent = new PricingAgent();
