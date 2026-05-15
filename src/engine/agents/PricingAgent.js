import { eventBus, EVENTS } from '../EventBus.js';
import { orchestrator } from '../Orchestrator.js';

class PricingAgent {
  constructor() {
    eventBus.subscribe(EVENTS.PROVIDER_SELECTED, this.calculatePrice.bind(this));
  }

  calculatePrice(payload) {
    const state = orchestrator.getState();
    const intent = state.extractedIntent || {};
    const isUrgent = intent.urgency === 'High';
    const budget = intent.budget || null;
    const isSurge = state.failures > 0; // Triggered by fallback/recovery
    
    setTimeout(() => {
      let base = 2000;
      let travel = 300;
      
      // Fix 4: Make pricing truly dynamic
      
      // Peak Hours Rule -> surge +15%
      const currentHour = new Date().getHours();
      const isPeakHour = currentHour >= 8 && currentHour <= 10 || currentHour >= 17 && currentHour <= 20;
      let peakSurge = (isPeakHour && state.isAgenticMode) ? Math.round(base * 0.15) : 0;

      // Heavy traffic area -> travel multiplier
      if (intent.location && intent.location.toLowerCase().includes('bahria')) {
        travel *= 1.5; // Far / Heavy traffic
      }
      
      // Urgency -> surge +25% of base
      let urgencyFee = (isUrgent && state.isAgenticMode) ? Math.round(base * 0.25) : 0; 
      
      // Weekend rule
      const day = new Date().getDay();
      if (day === 0 || day === 6) {
        base = Math.round(base * 1.10);
      }
      
      let recoverySurge = (isSurge && state.isAgenticMode) ? 500 : 0;
      
      let totalSurge = peakSurge + recoverySurge;
      let subTotal = base + travel + urgencyFee + totalSurge;
      
      // Random variance +/- 5% for realistic behavior (Agentic Only)
      const varianceFactor = state.isAgenticMode ? (1 + ((Math.random() * 0.1) - 0.05)) : 1;
      let total = Math.round(subTotal * varianceFactor);
      let varianceAmount = total - subTotal;
      
      // Low budget discount logic (Agentic Only)
      if (state.isAgenticMode && budget && budget > 0 && total > budget && (total - budget) < 1000) {
        const discount = total - budget;
        total -= discount;
        varianceAmount -= discount; // adjust variance to include discount
        eventBus.emit(EVENTS.SYSTEM_LOG, {
          agent: 'PricingAgent', action: 'DISCOUNT_APPLIED',
          trace: `System applied Rs ${discount} loyalty discount to meet user budget of Rs ${budget}.`,
          confidence: 1.0, toolUsed: 'Reason: Automated budget alignment logic'
        });
      }

      const pricing = { base, travel, urgency: urgencyFee, surge: totalSurge, variance: varianceAmount, total };

      eventBus.emit(EVENTS.PRICE_CALCULATED, { 
        agent: 'PricingAgent',
        trace: `Calculated dynamic pricing. Base: Rs${base} | Travel: Rs${travel} | Urgency: Rs${urgencyFee} | Surge: Rs${totalSurge} | Adjustments: Rs${varianceAmount}. Final Total = Rs${total}.`,
        confidence: 0.98,
        toolUsed: 'Reason: Applied dynamic surge matrix and historical constraints',
        pricing 
      });

    }, 800);
  }
}

export const pricingAgent = new PricingAgent();
