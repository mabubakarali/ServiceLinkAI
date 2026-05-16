import React, { createContext, useContext, useState, useEffect } from 'react';
import { eventBus, EVENTS, orchestrator } from '../engine/index.js';

const OrchestratorContext = createContext();

export const workflowSteps = [
  { key: 'PROCESSING_INTENT', label: 'Intent', detail: 'Parse request' },
  { key: 'PLANNING_WORKFLOW', label: 'Plan', detail: 'Build action graph' },
  { key: 'DISCOVERING_PROVIDERS', label: 'Discover', detail: 'Scan providers' },
  { key: 'RANKING_PROVIDERS', label: 'Rank', detail: 'Score matches' },
  { key: 'CALCULATING_PRICE', label: 'Price', detail: 'Compute estimate' },
  { key: 'ASSIGNED', label: 'Assign', detail: 'Confirm booking' },
  { key: 'SERVICE_STARTED', label: 'Service', detail: 'Track execution' },
  { key: 'FINISHED_ALL', label: 'Done', detail: 'Close the loop' },
];

export function OrchestratorProvider({ children }) {
  const [state, setState] = useState(orchestrator.getState());
  const [userInput, setUserInput] = useState("Mujhe kal subah 9 baje Bahria Phase 7 mein inverter AC technician chahiye. Cooling bohat kam hai.");

  useEffect(() => {
    const unsubState = eventBus.subscribe(EVENTS.STATE_UPDATED, (payload) => setState(payload.state));
    return () => unsubState();
  }, []);

  const startOrchestration = () => {
    eventBus.emit(EVENTS.REQUEST_RECEIVED, { 
      input: userInput,
      inputReceived: userInput,
      agent: 'AppInterface',
      trace: `User initiated new service request.`,
      confidence: 1.0,
      toolUsed: 'Reason: Received raw text from client interface'
    });
  };

  const simulateFailure = () => {
    if (state.selectedProvider) {
      eventBus.emit(EVENTS.PROVIDER_CANCELLED, { 
        providerId: state.selectedProvider.id,
        agent: 'Simulator',
        trace: `USER INJECTED FAILURE: ${state.selectedProvider.name} unexpectedly cancelled the job.`,
        confidence: 1.0,
        toolUsed: 'Reason: External interruption trigger'
      });
    }
  };

  const value = {
    state,
    userInput,
    setUserInput,
    startOrchestration,
    simulateFailure,
    workflowSteps
  };

  return <OrchestratorContext.Provider value={value}>{children}</OrchestratorContext.Provider>;
}

export function useOrchestrator() {
  const context = useContext(OrchestratorContext);
  if (!context) throw new Error("useOrchestrator must be used within OrchestratorProvider");
  return context;
}
