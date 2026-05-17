import { eventBus, EVENTS } from '../EventBus.js';
import { orchestrator } from '../Orchestrator.js';

class SupervisorAgent {
  constructor() {
    eventBus.subscribe(EVENTS.PROVIDER_RANKED, this.reviewMatch.bind(this));
  }

  reviewMatch(payload) {
    const { selectedProvider } = payload;
    
    // Check if the provider is Kamran S. (Mocking a high cancellation risk override)
    // Or if reliability is too low for a High urgency task.
    const state = orchestrator.getState();
    const isUrgent = state.extractedIntent?.urgency === 'High';

    if (isUrgent && selectedProvider.reliability < 0.90) {
      setTimeout(() => {
        eventBus.emit(EVENTS.SUPERVISOR_OVERRIDE, {
          agent: 'SupervisorAgent',
          trace: `OVERRIDE: Selected provider (${selectedProvider.name}) has ${(selectedProvider.reliability * 100).toFixed(0)}% reliability. Minimum 90% required for HIGH urgency tasks.`,
          confidence: 1.0,
          toolUsed: 'RiskModel'
        });
        
        eventBus.emit(EVENTS.RE_RANK_REQUESTED, { excludeId: selectedProvider.id });
      }, 500);
    } else {
      setTimeout(() => {
        const rejectedName = payload.rejectedProviders[0]?.name || 'None';
        const isComplex = state.extractedIntent?.complexity === 'Complex';
        const weightSummary = isComplex
          ? 'Skill (45%), Reliability (10%), Distance (10%), Cancellation Rate (10%), Fairness (10%), Recency (5%), Experience (5%), Rating (5%)'
          : 'Skill (15%), Distance (15%), Reliability (15%), Cancellation (15%), Fairness (10%), Rating (10%), Recency (10%), Experience (10%)';
        const reasoningTrace = `DECISION_CARD:\nSelected Provider: ${selectedProvider.name}\nReasons: Optimal proximity, high skill match, and strong past reliability.\nWeighted Factors: ${weightSummary}\nRejected ${rejectedName}: Lower overall confidence score.`;
        
        eventBus.emit(EVENTS.PROVIDER_SELECTED, { 
          ...payload,
          agent: 'SupervisorAgent',
          trace: reasoningTrace,
          confidence: 0.98,
          toolUsed: 'Reason: Verified constraints and approved final match'
        });
      }, 500 + Math.random() * 500);
    }
  }
}

export const supervisorAgent = new SupervisorAgent();
