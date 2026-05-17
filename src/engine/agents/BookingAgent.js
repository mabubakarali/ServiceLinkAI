import { eventBus, EVENTS } from '../EventBus.js';

import { orchestrator } from '../Orchestrator.js';

class BookingAgent {
  constructor() {
    eventBus.subscribe(EVENTS.PRICE_CALCULATED, this.executeBooking.bind(this));
  }

  executeBooking(payload) {
    setTimeout(() => {
      const state = orchestrator.getState();
      const isRecovery = state.failures > 0;
      const input = state.rawInput?.toLowerCase() || "";
      
      // Simulation: Scheduling Intelligence (Double-Booking Check)
      // Trigger a conflict if "9 baje" is mentioned and it's the first attempt
      if (input.includes('9 baje') && !isRecovery && !state.conflictResolved) {
        const requestedTime = state.extractedIntent?.eventTime || '09:00';
        const [hh] = requestedTime.split(':');
        const altHour = (parseInt(hh) + 1).toString().padStart(2, '0');
        const alternateSlot = `${altHour}:00`;

        eventBus.emit(EVENTS.SYSTEM_LOG, {
          agent: 'BookingAgent',
          action: 'CONFLICT_DETECTED',
          trace: `Scheduling Conflict: Selected provider has an overlapping appointment at ${requestedTime}.\nScheduling Intelligence: Alternate slot available at ${alternateSlot}. Initiating auto re-rank to find provider with clear ${requestedTime} slot + 30-min travel buffer.`,
          confidence: 0.98,
          toolUsed: 'Reason: Calendar Overlap Analysis'
        });

        setTimeout(() => {
          eventBus.emit(EVENTS.RE_RANK_REQUESTED, { 
            agent: 'BookingAgent',
            trace: `Scheduling Intelligence: Automatically re-ranking to find provider with clear ${requestedTime} slot + travel buffer. Alternate slot ${alternateSlot} reserved as fallback.`,
            confidence: 1.0,
            toolUsed: 'Reason: Automated Conflict Resolution',
            excludeId: state.selectedProvider.id
          });
        }, 1500);
        return;
      }

      const eventToEmit = isRecovery ? EVENTS.NEW_PROVIDER_ASSIGNED : EVENTS.BOOKING_CONFIRMED;
      
      eventBus.emit(eventToEmit, { 
        agent: 'BookingAgent',
        trace: `Booking locked in system. Travel-time buffer (15m) applied to schedule.`,
        confidence: 1.0,
        toolUsed: 'Reason: Verified availability and committed slot to database',
        schedule: { eta: '12 mins' }
      });
      
      if (isRecovery) {
        eventBus.emit(EVENTS.BOOKING_CONTINUES, {
          agent: 'BookingAgent',
          trace: 'System recovered automatically without restarting workflow',
          confidence: 1.0,
          toolUsed: 'Reason: SLA fulfilled post-recovery'
        });
      }

      this.simulateTimeline();
    }, 1000);
  }

  simulateTimeline() {
    let timer1 = setTimeout(() => {
      eventBus.emit(EVENTS.SERVICE_STARTED, { agent: 'BookingAgent', trace: `Service started. Job status updated to IN_PROGRESS.`, confidence: 1.0, toolUsed: 'Reason: Location verified via GPS' });
    }, 8000);

    // If failure is injected, we must clear the timeout!
    eventBus.subscribe(EVENTS.PROVIDER_CANCELLED, () => {
      clearTimeout(timer1);
    });
  }
}

export const bookingAgent = new BookingAgent();
