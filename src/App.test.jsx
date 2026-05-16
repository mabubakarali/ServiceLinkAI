import { describe, it, expect } from 'vitest';
import { workflowSteps } from './context/OrchestratorContext';

describe('ServiceLink AI Architecture Tests', () => {
  it('should have correct workflow steps defined', () => {
    expect(workflowSteps).toBeDefined();
    expect(workflowSteps.length).toBe(8);
  });

  it('should start with intent processing', () => {
    expect(workflowSteps[0].key).toBe('PROCESSING_INTENT');
  });

  it('should end with finished loop', () => {
    expect(workflowSteps[workflowSteps.length - 1].key).toBe('FINISHED_ALL');
  });
});
