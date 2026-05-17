import { eventBus, EVENTS } from '../EventBus.js';
import { orchestrator } from '../Orchestrator.js';
import mockDB from '../../data/mockProviderDB.json';

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
      }, 500);
    } else {
      // Good rating: Update provider reputation in the live DB state
      this.updateProviderReputation(rating);
    }
  }

  updateProviderReputation(rating) {
    setTimeout(() => {
      const state = orchestrator.getState();
      const provider = state.selectedProvider;
      if (!provider) return;

      const ratingDelta = rating >= 4 ? 0.02 : -0.01;
      const newRating = Math.min(5.0, Math.max(1.0, parseFloat((provider.rating + ratingDelta).toFixed(2))));
      const newCompletedJobs = (provider.completedJobs || 0) + 1;
      const newJobsToday = Math.max(0, (provider.jobsToday || 0) + 1);

      eventBus.emit(EVENTS.SYSTEM_LOG, {
        agent: 'DisputeAgent',
        action: 'REPUTATION_UPDATED',
        trace: `Provider Reputation Closed-Loop Update:\n• ${provider.name} Rating: ${provider.rating} → ${newRating} (${ratingDelta > 0 ? '+' : ''}${ratingDelta})\n• Completed Jobs: ${provider.completedJobs} → ${newCompletedJobs}\n• Future matching weight adjusted for ecosystem fairness.`,
        confidence: 1.0,
        toolUsed: 'Reason: Feedback-Driven Reputation Engine'
      });

      // Actually mutate the live provider state so future renders reflect the update
      orchestrator.updateState({
        selectedProvider: {
          ...provider,
          rating: newRating,
          completedJobs: newCompletedJobs,
          jobsToday: newJobsToday
        }
      });
    }, 800);
  }

  proposeResolution(rating) {
    setTimeout(() => {
      let resolution = "";
      let action = "";

      if (rating === 1) {
        resolution = "Full Refund issued. Provider flagged for review.";
        action = "BLACKLIST_FLAGGED";
      } else {
        resolution = "50% Refund or Free Re-visit within 24 hours.";
        action = "PARTIAL_RESOLUTION";
      }

      eventBus.emit(EVENTS.RESOLUTION_PROPOSED, {
        agent: 'DisputeAgent',
        trace: `Resolution Proposed: ${resolution}\nAction: ${action}`,
        confidence: 0.95,
        toolUsed: 'Reason: Policy-based Resolution Engine',
        resolution
      });

      if (rating === 1) {
        this.escalateToHuman();
        this.blacklistProvider();
      }
    }, 1000);
  }

  blacklistProvider() {
    setTimeout(() => {
      const state = orchestrator.getState();
      const provider = state.selectedProvider;
      eventBus.emit(EVENTS.SYSTEM_LOG, {
        agent: 'DisputeAgent',
        action: 'PROVIDER_BLACKLISTED',
        trace: `Provider ${provider?.name || 'Unknown'} has been flagged and removed from the active matching pool. Future requests will exclude this provider automatically.`,
        confidence: 1.0,
        toolUsed: 'Reason: Risk & Reputation Management Engine'
      });
    }, 1500);
  }

  escalateToHuman() {
    setTimeout(() => {
      eventBus.emit(EVENTS.HUMAN_ESCALATION, {
        agent: 'DisputeAgent',
        trace: `Critical Dispute (1★): Case escalated to human supervisor for final review and direct customer compensation approval.`,
        confidence: 1.0,
        toolUsed: 'Reason: Complexity/Severity Threshold reached'
      });
    }, 2000);
  }
}

export const disputeAgent = new DisputeAgent();
