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
      
      const isDispute = payload.rating < 3;
      
      this.updateState({ 
        feedbackProcessed: true
      });

      // Schedule the Session Summary with a conditional delay
      // If it's a dispute, we give the DisputeAgent time to work (3s)
      // Otherwise, we end quickly (1s)
      const sessionEndDelay = isDispute ? 3500 : 1000;

      setTimeout(() => {
        const updatedState = this.globalState;
        const recoveryUsed = updatedState.failures > 0 ? 'Yes (Provider Cancellation)' : updatedState.conflictResolved ? 'Yes (Scheduling Conflict Auto-Resolved)' : 'No';
        const summary = `Service Type: ${updatedState.extractedIntent?.service || 'Unknown'}\nProvider Selected: ${updatedState.selectedProvider?.name || 'N/A'}\nFinal Price: Rs ${updatedState.pricing?.total || 0}\nTotal Time: ~45 mins\nRecovery Workflow Used: ${recoveryUsed}\nSystem Confidence: HIGH (98%)`;
        
        const finalLog = {
          agent: 'Orchestrator',
          action: 'SESSION_ENDED',
          trace: summary, 
          confidence: 1.0, 
          toolUsed: 'Reason: Lifecycle successfully closed and state preserved'
        };

        this.updateState({ 
          status: 'FINISHED_ALL',
          logs: [...this.globalState.logs, finalLog]
        });
      }, sessionEndDelay);
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
      
      // Circuit Breaker: Prevent infinite re-ranking loops
      if (this.globalState.overrides > 3) {
        eventBus.emit(EVENTS.CLARIFICATION_REQUESTED, {
          agent: 'Orchestrator',
          trace: `HALTING LOOP: System has attempted re-ranking ${this.globalState.overrides} times without success. Supervisor requirements are not being met by available providers.`,
          confidence: 1.0,
          toolUsed: 'Reason: Agentic Circuit Breaker'
        });
      }
    });

    eventBus.subscribe(EVENTS.DISPUTE_RAISED, () => this.updateState({ status: 'DISPUTE_ACTIVE' }));
    eventBus.subscribe(EVENTS.RESOLUTION_PROPOSED, (payload) => this.updateState({ status: 'RESOLUTION_AWAITING', resolution: payload.resolution }));
    eventBus.subscribe(EVENTS.HUMAN_ESCALATION, () => this.updateState({ status: 'HUMAN_INTERVENTION_REQUIRED' }));

    eventBus.subscribe(EVENTS.SYSTEM_LOG, (log) => {
      this.globalState.logs = [...this.globalState.logs, log];
      eventBus.emit(EVENTS.STATE_UPDATED, { state: this.globalState });
    });
  }

  getState() {
    return this.globalState;
  }
}

export const orchestrator = new Orchestrator();
