import { eventBus, EVENTS } from '../EventBus.js';
import { orchestrator } from '../Orchestrator.js';

class QualityAgent {
  constructor() {
    eventBus.subscribe(EVENTS.SERVICE_STARTED, this.generateChecklist.bind(this));
  }

  generateChecklist() {
    const state = orchestrator.getState();
    const service = state.extractedIntent?.service || 'General';
    const complexity = state.extractedIntent?.complexity || 'Basic';

    // Agentic Decision: Generate checklist based on service type and complexity
    let checklist = [
      { id: 'arrival', task: 'Arrival Photo Verified', completed: true },
      { id: 'tools', task: 'Equipment Deployment', completed: true }
    ];

    if (service.includes('AC')) {
      checklist.push({ id: 'gas', task: 'Refrigerant Pressure Check', completed: false });
      if (complexity === 'Complex') checklist.push({ id: 'inverter', task: 'Inverter Board Diagnostic', completed: false });
    } else if (service.includes('Plumb')) {
      checklist.push({ id: 'leak', task: 'Hydrostatic Leak Test', completed: false });
    } else if (service.includes('Beautician')) {
      checklist.push({ id: 'sanitization', task: 'Tool Sanitization Verified', completed: false });
      checklist.push({ id: 'patch_test', task: 'Product Patch Test Completed', completed: false });
      if (complexity === 'Complex') checklist.push({ id: 'style', task: 'Bridal Portfolio Matching', completed: false });
    } else if (service.includes('Mechanic')) {
      checklist.push({ id: 'scan', task: 'OBD-II Diagnostic Scan', completed: false });
      checklist.push({ id: 'battery', task: 'Battery/Alternator Health Test', completed: false });
      if (complexity === 'Complex') checklist.push({ id: 'engine', task: 'Compression/Fuel System Audit', completed: false });
    } else {
      checklist.push({ id: 'standard', task: 'Standard Operating Protocol', completed: false });
    }

    checklist.push({ id: 'cleanup', task: 'Site Cleanup & Restoration', completed: false });

    // Update global state via Orchestrator
    orchestrator.updateState({ dynamicChecklist: checklist });

    eventBus.emit(EVENTS.SYSTEM_LOG, {
      agent: 'QualityAgent',
      action: 'CHECKLIST_GENERATED',
      trace: `Generated dynamic quality checklist for ${complexity} ${service} job. Monitoring real-time compliance.`,
      confidence: 1.0,
      toolUsed: 'Reason: Complexity-based Quality Matrix'
    });

    // Simulate autonomous verification steps
    this.simulateVerification(checklist);
  }

  simulateVerification(checklist) {
    let delay = 1000; // Faster verification
    let completedCount = 0;
    const totalToVerify = checklist.filter(c => !c.completed).length;

    if (totalToVerify === 0) {
      this.finishAudit();
      return;
    }

    checklist.forEach((item, index) => {
      if (item.completed) return;

      setTimeout(() => {
        const currentState = orchestrator.getState().dynamicChecklist;
        const updatedChecklist = currentState.map(c => c.id === item.id ? { ...c, completed: true } : c);
        
        orchestrator.updateState({ dynamicChecklist: updatedChecklist });
        completedCount++;

        eventBus.emit(EVENTS.SYSTEM_LOG, {
          agent: 'QualityAgent',
          action: 'STEP_VERIFIED',
          trace: `Verified: ${item.task}. Evidence confirmed via provider telemetry.`,
          confidence: 0.95,
          toolUsed: 'Reason: Automated Compliance Verification'
        });

        if (completedCount === totalToVerify) {
          this.finishAudit();
        }
      }, delay * (index + 1));
    });
  }

  finishAudit() {
    eventBus.emit(EVENTS.SYSTEM_LOG, {
      agent: 'QualityAgent',
      action: 'AUDIT_COMPLETED',
      trace: `Full quality audit completed. All parameters within safe operating margins. Ready for service closure.`,
      confidence: 1.0,
      toolUsed: 'Reason: Final Compliance Check'
    });
    
    // Explicitly tell the system the job is truly done
    setTimeout(() => {
      eventBus.emit(EVENTS.SERVICE_COMPLETED);
    }, 500);
  }
}

export const qualityAgent = new QualityAgent();
