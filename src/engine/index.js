import { eventBus, EVENTS } from './EventBus.js';
import { orchestrator } from './Orchestrator.js';

// Initialize all agents
import './agents/IntentAgent.js';
import './agents/PlannerAgent.js';
import './agents/MatchingAgent.js';
import './agents/PricingAgent.js';
import './agents/BookingAgent.js';
import './agents/RecoveryAgent.js';
import './agents/NotificationAgent.js';
import './agents/SupervisorAgent.js';
import './agents/DisputeAgent.js';
import './agents/QualityAgent.js';

export { eventBus, EVENTS, orchestrator };
