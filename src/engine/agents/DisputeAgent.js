import { eventBus, EVENTS } from '../EventBus.js';
import { orchestrator } from '../Orchestrator.js';

class DisputeAgent {
  constructor() {
    eventBus.subscribe(EVENTS.FEEDBACK_COLLECTED, this.handleFeedback.bind(this));
  }

  handleFeedback(payload) {
    const { rating } = payload;
    
    if (rating < 3) {
      setTimeout(() => {
        eventBus.emit(EVENTS.DISPUTE_RAISED, {
          agent: 'DisputeAgent',
          trace: `Low rating detected (${rating}/5). Analyzing user sentiment and service history for dispute resolution.`,
          confidence: 1.0,
          toolUsed: 'Reason: Automated Sentiment Analysis'
        });

        this.proposeResolution(rating);
      }, 1000);
    }
  }

  proposeResolution(rating) {
    setTimeout(() => {
      let resolution = "";
      if (rating === 1) {
        resolution = "Full Refund + 20% discount on next service.";
      } else {
        resolution = "50% Refund or Free Re-visit within 24 hours.";
      }

      eventBus.emit(EVENTS.RESOLUTION_PROPOSED, {
        agent: 'DisputeAgent',
        trace: `Resolution Proposed: ${resolution}`,
        confidence: 0.95,
        toolUsed: 'Reason: Policy-based Resolution Engine',
        resolution
      });

      // Simulation: If it's a 1-star, escalate to human
      if (rating === 1) {
        this.escalateToHuman();
      }
    }, 2000);
  }

  escalateToHuman() {
    setTimeout(() => {
      eventBus.emit(EVENTS.HUMAN_ESCALATION, {
        agent: 'DisputeAgent',
        trace: `Critical Dispute: Escalating to human supervisor for final review.`,
        confidence: 1.0,
        toolUsed: 'Reason: Complexity/Severity Threshold reached'
      });
    }, 1500);
  }
}

export const disputeAgent = new DisputeAgent();
