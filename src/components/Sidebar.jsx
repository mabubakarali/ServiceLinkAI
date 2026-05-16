import React from 'react';
import { useOrchestrator } from '../context/OrchestratorContext.jsx';

export function Sidebar() {
  const { state, userInput, setUserInput, startOrchestration, simulateFailure, workflowSteps } = useOrchestrator();

  const activeStepIndex = Math.max(workflowSteps.findIndex((step) => step.key === state?.status), 0);
  const providerCount = state?.rankedProviders?.length || 0;
  const shortlistedCount = state?.rankedProviders?.filter((provider) => provider.score >= (state.rankedProviders[0]?.score ?? 0) - 8).length || 0;
  const selectedProviderLabel = state?.selectedProvider?.name || 'Awaiting selection';
  const statusTone = state?.needsClarification ? 'warning' : state?.failures > 0 ? 'danger' : state?.status === 'FINISHED_ALL' ? 'success' : 'neutral';
  const statusLabel = state?.status?.replace(/_/g, ' ') || 'INITIALIZING';
  const intentService = state?.extractedIntent?.service || 'Unknown';
  const intentUrgency = state?.extractedIntent?.urgency || 'Medium';
  const intentLocation = state?.extractedIntent?.location || 'Unknown';
  const intentComplexity = state?.extractedIntent?.complexity || 'Basic';
  const pricingTone = state?.pricing
    ? state.pricing.variance > 0
      ? 'market-up'
      : state.pricing.variance < 0
        ? 'market-down'
        : 'stable'
    : 'stable';

  return (
    <aside className="sidebar panel-surface" aria-label="Control Panel">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">
          <span>⚙</span>
        </div>
        <div>
          <div className="brand-kicker">Service Orchestration OS</div>
          <h1 className="logo">ServiceLink AI</h1>
        </div>
      </div>

      <section className="card control-card" aria-labelledby="dynamic-input-heading">
        <div className="section-heading-row">
          <h3 id="dynamic-input-heading">Dynamic Input</h3>
          <span className="section-chip">Live command</span>
        </div>
        <p className="section-copy">Enter a service request in natural language. The workflow stays unchanged; only the presentation is elevated.</p>
        <textarea
          className="command-input"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          aria-label="Service request natural language input"
          placeholder="Describe your service needs..."
        />
        <button
          className="btn btn-primary btn-hero"
          onClick={startOrchestration}
          disabled={state?.status !== 'IDLE' && state?.status !== 'FINISHED_ALL' && state?.status !== 'PROCESSING_INTENT' && state?.status !== 'AWAITING_USER_CLARIFICATION'}
          aria-label="Run Dynamic Orchestration"
        >
          <span className="btn-icon" aria-hidden="true">▶</span>
          Run Dynamic Orchestration
        </button>
      </section>

      <section className="card status-card" aria-labelledby="lifecycle-heading">
        <div className="section-heading-row">
          <h3 id="lifecycle-heading">Lifecycle State</h3>
          <span className={`status-pill ${statusTone}`}>{statusLabel}</span>
        </div>
        <div className="status-meta">
          <div className="status-readout">
            <span>Service progress</span>
            <strong>{state?.serviceProgress ?? 0}%</strong>
          </div>
          <div className="progress-track" aria-label={`Progress: ${state?.serviceProgress ?? 0}%`} role="progressbar" aria-valuenow={state?.serviceProgress ?? 0} aria-valuemin="0" aria-valuemax="100">
            <div className="progress-fill" style={{ width: `${state?.serviceProgress ?? 0}%` }} />
          </div>
        </div>
        <div className="workflow-rail" aria-label="Workflow stages" role="list">
          {workflowSteps.map((step, index) => (
            <div key={step.key} role="listitem" className={`workflow-step ${index <= activeStepIndex ? 'active' : ''}`}>
              <span className="workflow-dot" aria-hidden="true" />
              <div>
                <div className="workflow-label">{step.label}</div>
                <div className="workflow-detail">{step.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card context-card premium-context-card" aria-labelledby="global-context-heading">
        <div className="section-heading-row">
          <h3 id="global-context-heading">Global Context</h3>
          <span className="section-chip subtle">{providerCount} ranked</span>
        </div>
        <p className="section-copy context-intro">A concise, visually guided summary of request intent, pricing pressure, provider selection, and quality signals.</p>

        <div className="context-hero">
          <div className="context-orb" aria-hidden="true" />
          <div className="context-hero-copy">
            <div className="context-panel-title context-title-row">
              <span>Operational snapshot</span>
              <span className={`status-pill ${statusTone}`}>{statusLabel}</span>
            </div>
            <h4>{selectedProviderLabel}</h4>
            <p>Current request intelligence, live pricing, and provider momentum are condensed here for fast decision reading.</p>
          </div>
        </div>

        <div className="context-chip-row" aria-label="Intent summary chips">
          <span className="context-chip accent">{intentService}</span>
          <span className="context-chip">{intentUrgency} urgency</span>
          <span className="context-chip">{intentLocation}</span>
          <span className={`context-chip ${pricingTone}`}>{state?.pricing ? `Rs ${state.pricing.total}` : 'Pricing pending'}</span>
        </div>

        <div className="mini-metric-grid" aria-label="Key metrics">
          <div className="mini-metric highlight">
            <span>Selected provider</span>
            <strong>{selectedProviderLabel}</strong>
          </div>
          <div className="mini-metric">
            <span>Shortlist depth</span>
            <strong>{shortlistedCount || 0}</strong>
          </div>
          <div className="mini-metric">
            <span>Intent complexity</span>
            <strong className={intentComplexity === 'Complex' ? 'text-danger' : 'text-success'}>{intentComplexity}</strong>
          </div>
          <div className="mini-metric">
            <span>Active rankers</span>
            <strong>{providerCount}</strong>
          </div>
        </div>

        <div className="context-stack">
          {state?.extractedIntent && (
            <div className="context-panel intent-panel">
              <div className="context-panel-title">Agent Extracted Intent</div>
              <div className="context-grid" role="list">
                <div role="listitem"><span>Service</span><strong>{intentService}</strong></div>
                <div role="listitem"><span>Urgency</span><strong>{intentUrgency}</strong></div>
                <div role="listitem"><span>Complexity</span><strong className={intentComplexity === 'Complex' ? 'text-danger' : 'text-success'}>{intentComplexity}</strong></div>
                <div role="listitem"><span>Location</span><strong>{intentLocation}</strong></div>
              </div>
            </div>
          )}

          {state?.pricing && (
            <div className="context-panel pricing-panel">
              <div className="context-panel-title accent">Pricing Transparency</div>
              <div className="pricing-grid" role="list">
                <div role="listitem"><span>Base Fee</span><strong>Rs {state.pricing.base}</strong></div>
                <div role="listitem"><span>Travel Fee</span><strong>Rs {state.pricing.travel}</strong></div>
                <div role="listitem"><span>Urgency Surge</span><strong>Rs {state.pricing.urgency}</strong></div>
                <div role="listitem"><span>Failure Surge</span><strong>Rs {state.pricing.surge}</strong></div>
                <div role="listitem"><span>Market Adj.</span><strong className={state.pricing.variance > 0 ? 'text-danger' : 'text-success'}>{state.pricing.variance > 0 ? '+' : ''}Rs {state.pricing.variance}</strong></div>
              </div>
              <div className="pricing-total">
                <span>Total</span>
                <strong>Rs {state.pricing.total}</strong>
              </div>
            </div>
          )}

          {state?.dynamicChecklist && (state?.status === 'SERVICE_STARTED' || state?.status === 'SERVICE_COMPLETED' || state?.status === 'FINISHED_ALL') && (
            <div className="context-panel checklist-panel">
              <div className="context-panel-title">Quality Audit</div>
              <div className="checklist-container" role="list">
                {state.dynamicChecklist.map((item, idx) => (
                  <label key={idx} className="checklist-item" role="listitem">
                    <input type="checkbox" checked={item.completed} readOnly aria-label={item.task} />
                    <span className={item.completed ? 'completed' : ''}>{item.task}</span>
                  </label>
                ))}
              </div>
              <div className="geo-tag">[GEO-TAG: {state.extractedIntent?.location || 'Verified'}]</div>
            </div>
          )}
        </div>
      </section>

      <div className="action-bar action-stack">
        <button 
          className="btn btn-danger btn-ghost" 
          onClick={simulateFailure} 
          disabled={state?.failures > 0 || (state?.status !== 'ASSIGNED' && state?.status !== 'EN_ROUTE' && state?.status !== 'ARRIVED')}
          aria-label="Inject Provider Cancellation Failure"
        >
          <span className="btn-icon" aria-hidden="true">⚠</span>
          Inject Provider Cancellation
        </button>
      </div>
    </aside>
  );
}
