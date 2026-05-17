import { eventBus, EVENTS } from '../EventBus.js';
import { orchestrator } from '../Orchestrator.js';

class NotificationAgent {
  constructor() {
    eventBus.subscribe(EVENTS.BOOKING_CONFIRMED, this.notifyUser.bind(this));
    eventBus.subscribe(EVENTS.NEW_PROVIDER_ASSIGNED, this.notifyUser.bind(this));
    eventBus.subscribe(EVENTS.SERVICE_COMPLETED, this.requestFeedback.bind(this));
  }

  notifyUser(payload) {
    setTimeout(() => {
      eventBus.emit(EVENTS.NOTIFICATION_SENT, {
        agent: 'NotificationAgent',
        trace: `Notified User: "Your service provider is confirmed and en-route."`,
        confidence: 0.98,
        toolUsed: 'Reason: Dispatched status update to customer communication channel'
      });
    }, 1500);
  }

  requestFeedback() {
    // Only send the "Awaiting Feedback" notification if the user hasn't already given it
    setTimeout(() => {
      const state = orchestrator.getState();
      if (state.feedbackProcessed) return;

      eventBus.emit(EVENTS.SYSTEM_LOG, { 
        agent: 'NotificationAgent',
        trace: `Notification Sent: WhatsApp feedback request dispatched to user. Awaiting customer rating...`,
        confidence: 1.0,
        toolUsed: 'ReputationEngine: Multi-Channel Dispatch'
      });
    }, 500); // Shorter delay so it appears BEFORE the user reacts
  }
}

export const notificationAgent = new NotificationAgent();
