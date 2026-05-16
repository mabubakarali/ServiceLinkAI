import { eventBus, EVENTS } from '../EventBus.js';

class PlannerAgent {
  constructor() {
    eventBus.subscribe(EVENTS.INTENT_PARSED, this.handleIntent.bind(this));
  }

  handleIntent(payload) {
    const intent = payload.intent;
    
    setTimeout(() => {
      const plan = {
        steps: ['MATCH_PROVIDER', 'CALCULATE_PRICE', 'BOOK_SLOT', 'NOTIFY_USER'],
        complexity: (intent.constraints?.length || 0) > 1 ? 'High' : 'Medium'
      };

      const planTrace = intent.suggestedStartTime 
        ? `Temporal constraint detected (${intent.eventTime}). Re-sequencing: Arrival mandated at ${intent.suggestedStartTime}. \nSteps: ${plan.steps.join(' -> ')}`
        : `Generated DAG based on ${plan.complexity} Complexity. Steps: ${plan.steps.join(' -> ')}`;

      eventBus.emit(EVENTS.PLAN_CREATED, { 
        agent: 'PlannerAgent',
        trace: planTrace,
        confidence: 0.99,
        toolUsed: 'Reason: Mapped extracted intent to structured execution DAG',
        plan 
      });

    }, 600);
  }
}

export const plannerAgent = new PlannerAgent();
