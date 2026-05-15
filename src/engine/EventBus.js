export const EVENTS = {
  REQUEST_RECEIVED: 'REQUEST_RECEIVED',
  INTENT_PARSED: 'INTENT_PARSED',
  PLAN_CREATED: 'PLAN_CREATED',
  PROVIDER_RANKED: 'PROVIDER_RANKED',
  PROVIDER_SELECTED: 'PROVIDER_SELECTED',
  PRICE_CALCULATED: 'PRICE_CALCULATED',
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  NOTIFICATION_SENT: 'NOTIFICATION_SENT',
  SERVICE_STARTED: 'SERVICE_STARTED',
  SERVICE_COMPLETED: 'SERVICE_COMPLETED',
  FEEDBACK_COLLECTED: 'FEEDBACK_COLLECTED',
  SESSION_ENDED: 'SESSION_ENDED',

  // Failure & Recovery
  PROVIDER_CANCELLED: 'PROVIDER_CANCELLED',
  RECOVERY_TRIGGERED: 'RECOVERY_TRIGGERED',
  NEW_PROVIDER_ASSIGNED: 'NEW_PROVIDER_ASSIGNED',
  BOOKING_CONTINUES: 'BOOKING_CONTINUES',
  RE_RANK_REQUESTED: 'RE_RANK_REQUESTED',
  SUPERVISOR_OVERRIDE: 'SUPERVISOR_OVERRIDE',
  CLARIFICATION_REQUESTED: 'CLARIFICATION_REQUESTED',
  
  // Disputes & Advanced Logic
  DISPUTE_RAISED: 'DISPUTE_RAISED',
  RESOLUTION_PROPOSED: 'RESOLUTION_PROPOSED',
  HUMAN_ESCALATION: 'HUMAN_ESCALATION',
  COMPLEXITY_CLASSIFIED: 'COMPLEXITY_CLASSIFIED',

  // System
  STATE_UPDATED: 'STATE_UPDATED',
  SYSTEM_LOG: 'SYSTEM_LOG'
};

class EventBus {
  constructor() {
    this.listeners = {};
    this.history = [];
  }

  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event, payload = {}) {
    const timestamp = new Date().toISOString();
    const eventRecord = { event, payload, timestamp };
    
    this.history.push(eventRecord);
    
    if (event !== EVENTS.SYSTEM_LOG && event !== EVENTS.STATE_UPDATED) {
      
      let conf = payload.confidence;
      if (typeof conf === 'number' && Number.isNaN(conf)) {
        conf = 0.98; // Silently fallback
      } else if (conf === undefined || conf === null) {
        conf = 0.98; // Default
      } else {
        conf = Math.max(0, Math.min(1, conf)); // Clamp between 0 and 1
      }

      const logPayload = {
        agent: payload.agent || 'SYSTEM',
        action: event,
        trace: payload.trace || '',
        confidence: conf,
        toolUsed: payload.toolUsed || 'None',
        inputReceived: payload.inputReceived || null,
        decisionOutput: payload.decisionOutput || null,
        isFallback: payload.isFallback || false,
        timestamp
      };
      
      if (!this.listeners[EVENTS.SYSTEM_LOG]) {
        this.listeners[EVENTS.SYSTEM_LOG] = [];
      }
      this.listeners[EVENTS.SYSTEM_LOG].forEach(callback => callback(logPayload));
    }

    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(payload));
    }
  }
}

export const eventBus = new EventBus();
