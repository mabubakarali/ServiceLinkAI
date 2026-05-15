import { eventBus, EVENTS } from '../EventBus.js';
import { orchestrator } from '../Orchestrator.js';

class RecoveryAgent {
  constructor() {
    eventBus.subscribe(EVENTS.PROVIDER_CANCELLED, this.handleFailure.bind(this));
  }

  handleFailure(payload) {
    const state = orchestrator.getState();
    const failedProviderId = payload.providerId || (state.selectedProvider && state.selectedProvider.id);

    setTimeout(() => {
      eventBus.emit(EVENTS.RECOVERY_TRIGGERED, {
        agent: 'RecoveryAgent',
        trace: `Critical Failure Detected: Provider Cancelled. SLA Risk High. Forcing immediate re-routing. Bypassing standard queue.`,
        confidence: 1.0,
        toolUsed: 'Reason: Initiated autonomous recovery protocol to maintain SLA'
      });

      // Trigger Matching Agent to Re-rank excluding the failed provider
      eventBus.emit(EVENTS.RE_RANK_REQUESTED, {
        excludeId: failedProviderId,
        isUrgent: true
      });

    }, 500);
  }
}

export const recoveryAgent = new RecoveryAgent();
