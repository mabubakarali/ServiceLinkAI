import { eventBus, EVENTS } from './EventBus.js';

class Orchestrator {
  constructor() {
    this.globalState = {
      status: 'IDLE',
      rawInput: null,
      extractedIntent: null,
      activePlan: null,
      discoveredProviders: [],
      rankedProviders: [],
      selectedProvider: null,
      rejectedProviders: [],
      pricing: null,
      schedule: null,
      logs: [],
      failures: 0,
      overrides: 0,
      serviceProgress: 0,
      needsClarification: false,
      feedbackProcessed: false,
      conflictResolved: false
    };

    this.initializeSubscriptions();
  }

  updateState(partialState) {
    this.globalState = { ...this.globalState, ...partialState };
    eventBus.emit(EVENTS.STATE_UPDATED, { state: this.globalState });
  }

  initializeSubscriptions() {
    eventBus.subscribe(EVENTS.REQUEST_RECEIVED, (payload) => {
      this.updateState({ 
        status: 'PROCESSING_INTENT', rawInput: payload.input,
        logs: [], failures: 0, overrides: 0, serviceProgress: 0, needsClarification: false,
        feedbackProcessed: false, conflictResolved: false,
        extractedIntent: null, activePlan: null, discoveredProviders: [],
        rankedProviders: [], selectedProvider: null, rejectedProviders: [], pricing: null, schedule: null
      });
    });

    eventBus.subscribe(EVENTS.CLARIFICATION_REQUESTED, (payload) => {
      this.updateState({ status: 'AWAITING_USER_CLARIFICATION', needsClarification: true });
    });

    eventBus.subscribe(EVENTS.INTENT_PARSED, (payload) => {
      this.updateState({ status: 'PLANNING_WORKFLOW', extractedIntent: payload.intent });
    });

    eventBus.subscribe(EVENTS.PLAN_CREATED, (payload) => this.updateState({ status: 'DISCOVERING_PROVIDERS', activePlan: payload.plan }));
    eventBus.subscribe(EVENTS.PROVIDER_DISCOVERED, (payload) => this.updateState({ status: 'RANKING_PROVIDERS', discoveredProviders: payload.providers }));
    
    eventBus.subscribe(EVENTS.PROVIDER_RANKED, (payload) => {
      this.updateState({ 
        status: 'SUPERVISOR_REVIEW', 
        rankedProviders: payload.rankedProviders,
        rejectedProviders: payload.rejectedProviders
      });
    });

    eventBus.subscribe(EVENTS.PROVIDER_SELECTED, (payload) => {
      this.updateState({ 
        status: 'CALCULATING_PRICE', 
        selectedProvider: payload.selectedProvider
      });
    });

    eventBus.subscribe(EVENTS.SUPERVISOR_OVERRIDE, () => this.updateState({ overrides: this.globalState.overrides + 1 }));
    eventBus.subscribe(EVENTS.PRICE_CALCULATED, (payload) => this.updateState({ status: 'AWAITING_ASSIGNMENT', pricing: payload.pricing }));
    eventBus.subscribe(EVENTS.BOOKING_CONFIRMED, (payload) => this.updateState({ status: 'ASSIGNED', schedule: payload.schedule }));
    eventBus.subscribe(EVENTS.NEW_PROVIDER_ASSIGNED, (payload) => this.updateState({ status: 'ASSIGNED', schedule: payload.schedule }));
    
    eventBus.subscribe(EVENTS.NOTIFICATION_SENT, () => this.updateState({ status: 'EN_ROUTE', serviceProgress: 25 }));
    eventBus.subscribe(EVENTS.SERVICE_STARTED, () => this.updateState({ status: 'SERVICE_STARTED', serviceProgress: 75 }));
    eventBus.subscribe(EVENTS.SERVICE_COMPLETED, () => this.updateState({ status: 'SERVICE_COMPLETED', serviceProgress: 100 }));
    
    eventBus.subscribe(EVENTS.FEEDBACK_COLLECTED, (payload) => {
      if (this.globalState.feedbackProcessed) return;
      this.updateState({ feedbackProcessed: true });

      const state = this.globalState;
      const summary = `Service Type: ${state.extractedIntent?.service || 'Unknown'}\nProvider Selected: ${state.selectedProvider?.name || 'N/A'}\nFinal Price: Rs ${state.pricing?.total || 0}\nTotal Time: ~45 mins\nRecovery Workflow Used: ${state.failures > 0 ? 'Yes' : 'No'}\nSystem Confidence: HIGH (98%)`;
      
      eventBus.emit(EVENTS.SESSION_ENDED, {
        agent: 'Orchestrator',
        trace: summary, 
        confidence: 1.0, 
        toolUsed: 'Reason: Lifecycle successfully closed and state preserved'
      });
    });

    eventBus.subscribe(EVENTS.SESSION_ENDED, () => {
      this.updateState({ status: 'FINISHED_ALL' });
    });

    eventBus.subscribe(EVENTS.PROVIDER_CANCELLED, () => {
      this.updateState({ status: 'RECOVERING_FAILURE', failures: this.globalState.failures + 1, selectedProvider: null, serviceProgress: 0 });
    });

    eventBus.subscribe(EVENTS.COMPLEXITY_CLASSIFIED, (payload) => {
      this.updateState({ 
        extractedIntent: { ...this.globalState.extractedIntent, complexity: payload.complexity } 
      });
    });

    eventBus.subscribe(EVENTS.RE_RANK_REQUESTED, () => {
      this.updateState({ conflictResolved: true });
    });

    eventBus.subscribe(EVENTS.DISPUTE_RAISED, () => this.updateState({ status: 'DISPUTE_ACTIVE' }));
    eventBus.subscribe(EVENTS.RESOLUTION_PROPOSED, (payload) => this.updateState({ status: 'RESOLUTION_AWAITING', resolution: payload.resolution }));
    eventBus.subscribe(EVENTS.HUMAN_ESCALATION, () => this.updateState({ status: 'HUMAN_INTERVENTION_REQUIRED' }));

    eventBus.subscribe(EVENTS.SYSTEM_LOG, (log) => {
      const logs = [...this.globalState.logs, log];
      this.updateState({ logs });
    });
  }

  getState() {
    return this.globalState;
  }
}

export const orchestrator = new Orchestrator();
